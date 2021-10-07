const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('take')
    .setDescription('Take an item and add it to your inventory.'),
  async execute(interaction) {
    return interaction.reply('👋');
  }
};
