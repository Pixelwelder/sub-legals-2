const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const getStatFields = require('../../../utils/getStatFields');
const getStatModifiers = require('../../../utils/getStatModifiers');
const ItemTypes = require('../../data/ItemTypes');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';
const getListEmbed = async (interaction) => {
  console.log('getListEmbed');
  const userId = interaction.member.id;
  const items = getSelectors(userId).selectInventory(store.getState());

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`${interaction.user.username}'s Inventory`)
    .setImage(`${imageRoot}/boxes_11.png`);

  const fields = items.map((item, index) => {
    return {
      name: `**${index + 1}** | ${item.displayName || 'Item'} ${item.type ? '\`' + item.type.toUpperCase() + '\`' : ''}`,
      value: `${item.description || 'An interesting item.'}`
    };
  });

  if (fields.length) {
    embed.addFields(fields);
    embed.setDescription('You can use `/inventory examine <item name or number>` to examine an item.');
  } else {
    embed.setDescription('You don\'t have any items.');
  }

  return { embeds: [embed], components: [] };
};

module.exports = getListEmbed;
