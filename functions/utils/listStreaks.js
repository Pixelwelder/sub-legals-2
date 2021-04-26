const Discord = require('discord.js');
const { DateTime } = require('luxon');
const getRemainingTime = require('../utils/getRemainingTime');

const isBroken = ({ checkIns }, hours = 24) => {
  const checkIn = checkIns[checkIns.length - 1];
  return DateTime.now().diff(DateTime.fromISO(checkIn), 'hours').hours > hours;
}
const listStreaks = (message, user, streaks, userParams = [], yargParams = {}) => {
  const tag = message.member.user.tag.split('#')[0];
  const listAll = !!yargParams.all;

  const getTimeString = (streak) => {
    if (streak.isHidden) return 'Deleted';
    const { checkIns } = streak;
    const brokenMessage = 'Broken';
    const checkIn = checkIns[checkIns.length - 1];
    const rem = getRemainingTime(checkIn, 24, brokenMessage)
    return rem.str;
  }
  const embed = new Discord.MessageEmbed()
    .setColor('0x000000')
    .setTitle(`Streaks: ${tag}`)
    .addFields(
      streaks
        .filter((streak) => {
          if (listAll) return true;
          if (streak.isHidden) return false;
          // if (!listAll && isBroken(streak)) return false;
          return true;
        })
        .map((streak) => {
          const { displayName, current, longest, total, checkIns } = streak;
          let str = `Current: ${isBroken(streak) ? 0 : current} | Longest: ${longest} | Total: ${total}`;
          str += ` | (${getTimeString(streak)})`

          return {
            name: displayName,
            value: str
          };
        }));

  if (!streaks.length) embed.setDescription('You have no current streaks.');

  message.channel.send(embed);
};

module.exports = listStreaks;
