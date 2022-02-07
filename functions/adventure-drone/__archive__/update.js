const admin = require('firebase-admin');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getClient } = require('../client');

// This updates all users with Discord usernames.
module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription(`Update usernames.`),

  async execute(interaction) {
    const client = getClient();
    const userDocs = await admin.firestore().collection('discord_users').get();
    const users = userDocs.docs.map(doc => doc.data());
    const usersToUpdate = users.sort((a, b) => b.xp - a.xp).filter(user => !user.displayName);
    
    // Update all users with their discord usernames.
    const newUsers = [];
    const promises = usersToUpdate.slice(0, 20).map(async (user) => {
      if (user.displayName) return Promise.resolve();

      try {
        console.log('fetching', user);
        const discordUser = await client.users.fetch(user.uid);
        newUsers.push({ ...user, displayName: discordUser.username });
      } catch (e) {
        console.error(e.message);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);

    // Now create a transaction to update all users.
    await admin.firestore().runTransaction(async (transaction) => {
      const promises = newUsers.map(async (user) => {
        const doc = await transaction.get(admin.firestore().collection('discord_users').doc(user.uid));
        if (!doc.exists) {
          console.log(`No user found for ${user.uid}`);
          return Promise.resolve();
        }

        console.log('Updating user', user.uid, user.displayName);
        await transaction.update(doc.ref, { displayName: user.displayName });
      });

      await Promise.all(promises);
    });

    try {
      interaction.reply(`Updated ${usersToUpdate.length} users.`);
    } catch (e) {
      console.error(e.message);
    }

    console.log('Command complete');
  }
}
