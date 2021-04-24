const Discord = require('discord.js');

const listStreaks = (message, streaks) => {
  const tag = message.member.user.tag.split('#')[0];
  const embed = new Discord.MessageEmbed()
    .setColor('0x000000')
    .setTitle(`Streaks: ${tag}`)
    .addFields(
      streaks
        .filter(({ isHidden }) => !isHidden)
        .map(({ displayName, current, longest, total }) => ({
          name: displayName,
          value: `Current: ${current} | Longest: ${longest} | Total: ${total}`
        })));

  if (!streaks.length) embed.setDescription('You have no current streaks.');

  message.channel.send(embed);
};

module.exports = listStreaks;
