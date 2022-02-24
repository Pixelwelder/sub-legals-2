const { getFirestore } = require('firebase-admin/firestore');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getClient } = require('../client');
const { admin } = require('../settings');
const { MessageEmbed } = require('discord.js');

const num = 3;
const time = 3;
const likelihood = 0.3;
const min = 2;
const max = 7;
let executing = false;
let count = 0;
const extremePrejudice = false;
const tagUser = true;
const resultsById = {};

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/discord/ui';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('detect')
    .setDescription('Detect potential Humans.'),
    // .addUserOption(option => option
    //   .setName('resident')
    //   .setDescription('A user to examine. If not specified, the drone will detect any humans.')),

  async execute(interaction) {
    if (executing) {
      interaction.reply({ content: '❌', ephemeral: true });
      return;
    }

    executing = true;
    const client = getClient();
    // const resident = interaction.options.getUser('resident');
    const fields = [];

    const embed = new MessageEmbed()
      .setTitle('DETECT HUMANS')
      .setColor(0x00ff00)
      .setDescription('All exits sealed. Searching for potential Humans...');

    await interaction.deferReply();
    await interaction.editReply({ embeds: [embed] });

    const getRandomUser = async () => {
      const userDoc = userDocs.docs[Math.floor(userDocs.size * Math.random())];
      const user = await client.users.fetch(userDoc.id);
      return { user, userDoc };
    }

    const search = async () => {
      ({ user: lastUser, userDoc: lastUserDoc } = await getRandomUser());
      if (fields.length) {
        fields[fields.length - 1].value = 'CLEARED';
      }
      fields.push({ name: lastUser.username, value: 'EXAMINING...' });
      embed.setFields(fields);
      await interaction.editReply({ embeds: [embed] });

      let chance = likelihood;
      if (count < min) chance = 0;
      if (count >= max) chance = 1;
      const actual = Math.random();
      if (actual <= chance) {
        // Found em.
        find();
        return;
      }

      // message.channel.send(`🔍 ${lastUser.username}...`);
      count ++;
      setTimeout(search, time * 1000);
    };

    const find = async () => {
      count = 0;

      const user = lastUserDoc.data();
      user.opinion = Math.max(0, user.opinion - (extremePrejudice ? 2 : 1));
      await lastUserDoc.ref.update(user);

      resultsById[lastUser.id] = resultsById[lastUser.id] || Math.round(Math.random() * 100);
      const userString = tagUser ? `<@${lastUser.id}>` : lastUser.username;
      embed.setImage(`${imageRoot}/human.png`);
      embed.setDescription(`There is a ${resultsById[lastUser.id]}% chance that ${userString} is a human.`);
      embed.setFields([]);
      interaction.editReply({ embeds: [embed] });
      
      // interaction.followUp(`🚨<:human:821874570448601118> ${userString} <:human:821874570448601118>🚨`);

      executing = false;
    };

    // TODO Obviously this should come from a reducer.
    const userDocs = await getFirestore().collection('discord_users').orderBy('xp', 'desc').limit(50).select('uid').get();
    console.log('Searching among', userDocs.size, 'users.');
    search();
    

    // if (resident) {
    //   const { id } = resident;
    //   const user = client.users.cache.get(id);
    //   console.log(user);
    // }
    
    // interaction.channel.send(`_enfolds <@${id}> in a mechanical embrace (at <@${interaction.user.id}>'s request)_`);
    // interaction.reply({ content: 'Hug deployed!', ephemeral: true });
  }
};
