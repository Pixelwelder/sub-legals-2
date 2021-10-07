const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { getRank, getRankInContext } = require('../utils/rank');
const xp = require('../utils/xp');
const { getClient } = require('../client-v2');

// Tells the user their rank.
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription(`Get the tier rank of a station resident (or yourself).`)
    .addUserOption(option => option.setName('resident').setDescription('The individual in question.')),
  async execute(interaction) {
    const user = interaction.options.getUser('resident') || interaction.user;
    const { id } = user;
    const { rank, total } = await getRank(id);
    // interaction.reply(`you are #${rank} of ${total}.`);

    const client = getClient();
    const embed = new MessageEmbed()
      .setColor('0x000000')
      .setTitle(`Rank`);

    const { startRank, ranks } = getRankInContext(id);
    const fields = await Promise.all(ranks.map(async (rank, index) => {
      const user = await client.users.fetch(rank.id);
      const username = user.id === id ? `*${user.username}*` : user.username
      return {
        name: `${startRank + index}: ${username}`,
        value: `Tier ${xp.toTier(rank.xp)}`
      };
    }));

    const users = await Promise.all(ranks.map(async (rank) => {
      const user = await client.users.fetch(rank.id);
      return user;
    }));
    const str = users.reduce((accum, user, index) => {
      const name = user.id === id ? `**${user.username}**` : user.username;
      return `${!accum ? '' : accum + '\n'}${startRank + index}: ${name}`
    }, '');

    embed.addFields(fields);

    interaction.reply({ embeds: [embed] });
    // interaction.reply({ content: 'Your rank!', ephemeral: true });
  }
};

const old = {
  name: 'rank',
  usage: 'rank',
  description: 'Tells you your rank.',
  aliases: [],
  hide: false,
  execute: async function (message, options, userParams, yargParams) {
    const { id } = message.author;
    const { rank, total } = await getRank(id);
    message.reply(`you are #${rank} of ${total}.`);

    const embed = new MessageEmbed()
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

