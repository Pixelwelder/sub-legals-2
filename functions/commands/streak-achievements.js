const Discord = require('discord.js');
const getStreaks = require('../utils/getStreaks');

module.exports = {
  name: 'streak:achievements',
  usage: 'streak:achievements',
  hide: false,
  aliases: ['achievements', 'sa'],
  description: 'List your achievements.',
  execute: async function (message, options, userParams, yargParams) {
    const { user } = await getStreaks(message);
    const tag = message.member.user.tag.split('#')[0];
    if (user.achievements.length) {
      const embed = new Discord.MessageEmbed()
        .setColor('0x000000')
        .setTitle(`Achievements: ${tag}`)
        .addFields(
          user.achievements.map(({ displayName, description }) => ({ name: displayName, value: description }))
        );

      message.reply(embed);
    } else {
      message.reply('you have no achievements yet.');
    }
  }
};
