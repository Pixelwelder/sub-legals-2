const { MessageEmbed } = require('discord.js');
const store = require('../../store');
const { selectors: craftSelectors } = require('../../store/craft');
const DialogIds = require('../../data/DialogIds');
const sortByType = require('../../../utils/sortByType');
const getButtonGrid = require('../../../utils/getButtonGrid');
const getImage = require('./getImage');
const getAbort = require('./getAbort');

const getListEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { itemTypes, itemIndex = -1, constructionProject, itemPage = 0 } = data;

  if (!itemTypes || !itemTypes.length) return getAbort(userId, { content: 'No itemTypes.' });
  if (itemIndex === -1) return getAbort(userId, { content: 'No itemIndex.' });
  const selectedUid = constructionProject.partUids[itemIndex];

  const itemsByType = sortByType(inventory);
  const availableItems = itemTypes.reduce((acc, option) => {
    const items = itemsByType[option];
    return items ? [...acc, ...items] : acc;
  }, []);

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`NANOFORGE | CHOOSE ITEM`)
    .setImage(getImage(thread))
    .setDescription(`You have ${availableItems.length} items.`);

  const components = getButtonGrid({
    items: availableItems, backId: `goto-${DialogIds.SCHEMATIC}`, page: itemPage, selectedUid, name: 'item'
  });
  return { embeds: [embed], components };
};

module.exports = getListEmbed;
