const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Say hello to Adventure Drone!'),
  async execute(interaction) {
    return interaction.reply('👋');
  }
};
