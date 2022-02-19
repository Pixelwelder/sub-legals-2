const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed } = require('discord.js');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const getStats = (stats) => {};

const getStatModifiers = (statModifiers) => {};

const getItemEmbed = async (userId) => {
  console.log('getItemEmbed');
  const { data: { searchString = '' } } = getSelectors(userId).selectThread(store.getState());
  const items = getItems({ userId, searchString });
  console.log('items', items.length);

  if (items.length === 0) {
    return { content: `You don't have an item called "${searchString}".`};
  } else if (items.length > 1) {
    return {
      content: `Can you be more specific or use a number? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    };
  }

  const [item] = items;
  const {
    displayName, description, image,
    data: { stats, statModifiers, fields }
  } = item;

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(displayName.toUpperCase());

  if (fields) embed.addFields(fields);
  if (image) embed.setImage(`${imageRoot}/${image}`);
  
  return { embeds: [embed] };
};

module.exports = getItemEmbed;
