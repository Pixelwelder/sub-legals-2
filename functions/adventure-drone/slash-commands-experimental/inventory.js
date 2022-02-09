const admin = require('firebase-admin');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed } = require('discord.js');

// When we load, we grab all items from the database. This is probably not scalable.
let itemsByOwner = {};
const init = async () => {
  console.log('initializing inventory');
  const docs = await admin.firestore().collection('discord_inventory').get();
  const items = docs.docs.map(doc => doc.data());
  itemsByOwner = items.reduce((acc, item) => {
    if (!acc[item.owner]) acc[item.owner] = [];
    acc[item.owner].push(item);
    return acc;
  });
};
init();

// TODO Handle numbers above 26.
const numToLetter = (num) => String.fromCharCode(0x41 + num);
const letterToNum = (letter) => letter.charCodeAt(0) - 0x41;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription(`Do stuff with your inventory.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List the items in your inventory.'))
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine an inventory item.')
      .addStringOption(option => option
        .setName('letter')
        .setDescription('The letter of the item (A, B, C, etc.) to examine.')
      ))
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Show an inventory item to the room.')
      .addStringOption(option => option
        .setName('letter')
        .setDescription('The letter of the item (A, B, C, etc.) to show.')
        .setRequired(true)
      )),
    
  // TODO Don't use reply.
  async execute(interaction) {
    const command = {
      'list': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply();

        // Even though we have all items, we refresh here.
        const itemDocs = await admin.firestore().collection('discord_inventory').where('owner', '==', interaction.member.id).get();
        const items = itemDocs.docs.map(doc => doc.data());
        itemsByOwner[interaction.member.id] = items;

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`<@${interaction.user.id}>'s Inventory`);

        const fields = items.map((item, index) => {
          console.log('item', item);
          return {
            name: `${numToLetter(index)} | ${item.displayName || 'Item'}`,
            value: item.description || 'An interesting item.',
            inline: true
          };
        });

        embed.addFields(fields);
        interaction.editReply({ embeds: [embed], ephemeral: true });
      },
      'examine': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply();

        const letter = interaction.options.getString('letter');
        const item = itemsByOwner[interaction.member.id][letterToNum(letter)];
        console.log('item', letter, letterToNum(letter), item);

        if (!item) {
          interaction.reply('You don\'t have that item.', { ephemeral: true });
          return;
        }

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`<@${interaction.user.id}>'s Inventory`)
          .addField('Item', item.displayName || 'Item', true)
          .addField('Description', item.description || 'An interesting item.', true);
        interaction.editReply({ embeds: [embed], ephemeral: true });
      },
      'show': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply();

        const letter = interaction.options.getString('letter');
        const item = itemsByOwner[interaction.member.id][letterToNum(letter)];
        console.log('item', letter, letterToNum(letter), item);

        if (!item) {
          interaction.editReply(`You don't have that item.`, { ephemeral: true });
          return;
        }

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`<@${interaction.user.id}>'s Inventory`)
          .addField('Item', item.displayName || 'Item', true)
          .addField('Description', item.description || 'An interesting item.', true);

        interaction.editReply({ embeds: [embed] });
      }
    }[interaction.options.getSubcommand()];

    if (command) await command();
    console.log('Command complete');
  }
}
