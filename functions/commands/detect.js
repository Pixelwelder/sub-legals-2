const admin = require('firebase-admin');

// TODO This is single-server.
const num = 3;
const time = 3;
const likelihood = 0.3;
const min = 2;
const max = 7;
let underway = false;
let count = 0;
module.exports = {
  name: '_detect',
  usage: 'award <user> --award <award name>',
  description: 'Detect a human.',
  aliases: [],
  hide: true,
  // TODO This will notify people from ALL servers.
  execute: async function (message, options, userParams, yargParams) {
    if (underway) {
      message.react('❌');
      return;
    }

    let lastUser;

    underway = true;
    const userDocs = await admin.firestore().collection('discord_users').get();
    const getRandomUser = async () => {
      const userDoc = userDocs.docs[Math.floor(userDocs.size * Math.random())];
      const user = await message.client.users.fetch(userDoc.id);
      return user;
    }

    const search = async () => {
      let chance = likelihood;
      if (count < min) chance = 0;
      if (count >= max) chance = 1;
      const actual = Math.random();
      if (actual <= chance) {
        // Found em.
        find();
        return;
      }

      lastUser = await getRandomUser();
      message.channel.send(`🔍 ${lastUser.username}...`);
      count ++;
      setTimeout(search, time * 1000);
    };

    const find = () => {
      count = 0;
      underway = false;
      const userString = yargParams.tag ? `<@${lastUser.id}>` : lastUser.username;
      message.channel.send(`🚨<:human:821874570448601118> ${userString} <:human:821874570448601118>🚨`);
    };

    message.channel.send('All exits sealed. Searching for potential Humans...');
    search();
  }
};
