const { SlashCommandBuilder } = require('@discordjs/builders');
const { PLAYER_ROLE } = require('../adventure-drone/constants');
const { getClient, fetchGuild } = require('../client-v2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Enter the game.'),
  async execute(interaction) {
    const client = getClient();
    const guild = await fetchGuild();
    const member = await guild.members.fetch(interaction.user.id);
    const roles = await guild.roles.fetch();
    const role = roles.find(({ name }) => name === PLAYER_ROLE);
    await member.roles.add(role);

    return interaction.reply('✔️');
  }
};
