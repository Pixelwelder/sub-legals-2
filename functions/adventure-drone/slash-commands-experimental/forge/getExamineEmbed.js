const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const store = require('../../store');
const { selectors: craftSelectors } = require('../../store/craft');
const getImage = require('./getImage');
const getAbort = require('./getAbort');

const getExamineEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { itemUid } = data;

  if (!itemUid) return getAbort(userId, { content: 'No itemUid.' });

  console.log('getExamineEmbed', itemUid);
  console.log(inventory);
  const item = inventory.find(item => item.uid === itemUid);
  if (!item) return getAbort(userId, { content: 'No item.' });

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`NANOFORGE | EXAMINE`)
    .setImage(getImage(thread))
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
