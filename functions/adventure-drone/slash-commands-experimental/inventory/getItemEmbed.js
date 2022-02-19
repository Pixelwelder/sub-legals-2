const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed } = require('discord.js');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const getStatFields = require('../../../utils/getStatFields');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const getStatModifiers = (statModifiers) => {
  const statString = Object.entries(statModifiers).reduce((acc, [_name, _value], index) => {
    const name = capitalize(_name);
    const value = _value > 1 ? `+${_value}` : _value;
    const string = `${value} ${name}`;
    return acc ? `${acc}, ${string}` : string;
  }, '');

  return statString;
};

const getDescription = (item) => {
  let description = item.description || '';
  if (item.data.statModifiers) description = `${description}\n\n${getStatModifiers(item.data.statModifiers)}`;

  return description;
};

const getItemEmbed = async (userId) => {
  const { data: { searchString = '' } } = getSelectors(userId).selectThread(store.getState());
  const items = getItems({ userId, searchString });

  if (items.length === 0) {
    return { content: `You don't have an item called "${searchString}".`};
  } else if (items.length > 1) {
    return {
      content: `Can you be more specific or use a number? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    };
  }

  const [item] = items;
  const {
    displayName, image,
    data: { stats, statModifiers, fields }
  } = item;

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(displayName.toUpperCase());

  if (fields) embed.addFields(fields);
  if (stats) embed.addFields(getStatFields(stats));
  if (image) embed.setImage(`${imageRoot}/${image}`);
  embed.setDescription(getDescription(item));
  
  
  
  return { embeds: [embed] };
};

module.exports = getItemEmbed;
