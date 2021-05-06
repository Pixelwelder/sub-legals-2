const Discord = require('discord.js');
const { getRank, getRankInContext } = require('../utils/rank');
const xp = require('../utils/xp');

module.exports = {
  name: 'rank',
  usage: 'rank',
  description: 'Tells you your rank.',
  aliases: [],
  hide: true,
  execute: async function (message, options, userParams, yargParams) {
    const { id } = message.author;
    const { rank, total } = await getRank(id);
    message.reply(`you are #${rank} of ${total}.`);

    const embed = new Discord.MessageEmbed()
      .setColor('0x000000')
      .setTitle(`Rank`);

    const { startRank, ranks } = getRankInContext(message.author.id);
    const fields = await Promise.all(ranks.map(async (rank, index) => {
      const user = await message.client.users.fetch(rank.id);
      const username = user.id === id ? `*${user.username}*` : user.username
      return {
        name: `${startRank + index}: ${username}`,
        value: `Tier ${xp.toTier(rank.xp)}`
      };
    }));

    const users = await Promise.all(ranks.map(async (rank) => {
      const user = await message.client.users.fetch(rank.id);
      return user;
    }));
    const str = users.reduce((accum, user, index) => {
      const name = user.id === id ? `**${user.username}**` : user.username;
      return `${!accum ? '' : accum + '\n'}${startRank + index}: ${name}`
    }, '');

    embed.addFields(fields);

    message.reply(embed);
  }
}

