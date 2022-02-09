const admin = require('firebase-admin');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminventory')
    .setDescription(`Administrate inventory.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List the items in your inventory.'))
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create an inventory item (and add it to your inventory).')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The inventory item to create.')
      ))
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine an inventory item.')
      .addStringOption(option => option
        .setName('letter')
        .setDescription('The letter of the item to examine (from list).')
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
      'list': async () => {
        const items = await admin.firestore().collection('discord_inventory').where('owner', '==', interaction.member.id).get();

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`<@${interaction.user.id}>'s Inventory`);

        const fields = items.docs.map((itemDoc, index) => {
          const item = itemDoc.data();
          console.log('item', item);
          return {
            name: `${String.fromCharCode(0x41 + index)} | ${item.displayName || 'Item'}`,
            value: item.description || 'An interesting item.',
            inline: true
          };
        });

        embed.addFields(fields);
        interaction.reply({ embeds: [embed] });
      },
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
