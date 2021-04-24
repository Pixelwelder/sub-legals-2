const Discord = require('discord.js');
const getRemainingTime = require('../utils/getRemainingTime');

const listStreaks = (message, user, streaks) => {
  const tag = message.member.user.tag.split('#')[0];
  const embed = new Discord.MessageEmbed()
    .setColor('0x000000')
    .setTitle(`Streaks: ${tag}`)
    .addFields(
      streaks
        .filter(({ isHidden }) => !isHidden)
        .map(({ displayName, current, longest, total, checkIns }) => ({
          name: displayName,
          value: `Current: ${current} | Longest: ${longest} | Total: ${total} | (${getRemainingTime(checkIns[checkIns.length - 1]).toFormat('hh:mm:ss')} to check in)`
        })));

  if (user.achievements && user.achievements.length) {
    console.log(user.achievements);
    const achievementsString = user.achievements.reduce((accum, achievement) => {
      const str = accum ? `${accum} | ` : '';
      return `${str}${achievement.displayName}`;
    }, '');
    embed.addFields([{ name: 'Achievements', value: achievementsString }])
  }

  if (!streaks.length) embed.setDescription('You have no current streaks.');

  message.channel.send(embed);
};

module.exports = listStreaks;
