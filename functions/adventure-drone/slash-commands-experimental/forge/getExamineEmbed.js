const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const store = require('../../store');
const { selectors: craftSelectors } = require('../../store/craft');
const getAbort = require('./getAbort');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const getExamineEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { itemUid } = data;

  if (!itemUid) return getAbort(userId, { content: 'No itemUid.' });

  console.log('getExamineEmbed', itemUid);
  const item = inventory.find(item => item.uid === itemUid);
  if (!item) {
    console.log(' ------ NO DATA ------');
    console.log(itemUid);
    console.log(inventory.map(item => item.uid));
    console.log(' ------ /NO DATA ------');
    return getAbort(userId, { content: 'No item.' });
  }

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`NANOFORGE | ${item.displayName}`)
    .setImage(`${imageRoot}/${item.image}`)
    .setDescription(item.description);

  const utilityRow = new MessageActionRow()
    .addComponents([
      new MessageButton()
        .setCustomId(`shutdown`)
        .setLabel('DONE')
        .setStyle('SECONDARY')
    ]);

  return { embeds: [embed], components: [utilityRow] };
};

module.exports = getExamineEmbed;
