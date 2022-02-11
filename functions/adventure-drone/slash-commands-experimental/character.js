const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { getFirestore } = require('firebase-admin/firestore');

// Create an array of emojis, one for each letter.
const emojis = [
  '🅰', '🅱', '🅲', '🅳', '🅴', '🅵', '🅶', '🅷', '🅸', '🅹', '🅺', '🅻', '🅼', '🅽', '🅾', '🅿', '🆀', '🆁', '🆂', '🆃', '🆄', '🆅', '🆆', '🆇', '🆈', '🆉'
];
// TODO Handle numbers above 26.
const numToLetter = (num) => String.fromCharCode(0x41 + num);
const letterToNum = (letter) => letter.toUpperCase().charCodeAt(0) - 0x41;
const numToLetterEmoji = (num) => emojis[Math.min(num, 25)];

const fullEmoji = '🟥';
const empty = '⬛';
const point = '🔴';
// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (num, max, full = fullEmoji) => {
  return `${full.repeat(num)}${empty.repeat(max - num)}`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription(`Do stuff with your character.`)
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine your character.')
    ),
    
  // TODO Don't use reply.
  async execute(interaction) {
    const command = {
      'examine': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply({ ephemeral: true });

        const avatarUrl = interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 });
        
        const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.member.id).get();
        const character = characterDocs.docs[0].data();
        console.log(`found ${characterDocs.size} character`);

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(character.displayName)
          .setImage(avatarUrl);

        const fields = character.stats.map((stat, index) => {
          console.log('stat', stat);
          return {
            name: stat.displayName,
            value: getBar(stat.value, stat.max)
          };
        });

        fields.push({ name: 'Available points', value: getBar(character.statPoints, character.statPoints, point) });
        embed.setFields(fields);

        interaction.editReply({ embeds: [embed] });
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (e) {
        console.error(e);
        interaction.editReply('Oops, something went wrong.');
      } finally {
        console.log('Command complete');
      }
    }
  }
};