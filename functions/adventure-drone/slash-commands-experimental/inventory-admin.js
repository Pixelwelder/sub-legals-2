const admin = require('firebase-admin');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminventory')
    .setDescription(`Administrate inventory.`)
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create an inventory item (and add it to your inventory).')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The inventory item to create.')
      ))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Delete an inventory item.')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The minion to delete.')
      )),

  async execute(interaction) {
    const command = {
      'create': async () => {
        const rawName = interaction.options.getString('name');
        console.log('Creating inventory item');
        interaction.reply(`Creating inventory item`);
      },
      'delete': async () => {
        console.log('Deleting inventory item');
        interaction.reply(`Deleting inventory item`);
      }
    }[interaction.options.getSubcommand()];

    if (command) await command();
    console.log('Command complete');
  }
}
