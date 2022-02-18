const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { selectors: craftSelectors } = require('../../store/craft');
const store = require('../../store');
const getImage = require('./getImage');
const ItemTypes = require('../../data/ItemTypes');
const getButtonGrid = require('../../../utils/getButtonGrid');

const getMainMenuEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { schematicPage = 0 } = data;

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | ONLINE')
    .setImage(getImage(thread));

  // Add a button for each inventory item of type SCHEMATIC.
  const schematics = inventory.filter(item => item.type === ItemTypes.SCHEMATIC);
  console.log('schematics', schematics.length);
  
  const actionRow = new MessageActionRow();
  let components;
  if (schematics.length) {
    components = getButtonGrid({ items: schematics, page: schematicPage, name: 'schematic' });
  } else {
    components = [
      new MessageActionRow()
        .addComponents([
          new MessageButton()
            .setCustomId('disabled')
            .setLabel('No Schematics')
            .setStyle('SECONDARY')
            .setDisabled(true)
        ])
    ];
  }
  // Add description.
  embed.setDescription(`You have ${schematics.length} schematic${schematics.length === 1 ? '' : 's'}.`);
  return { embeds: [embed], components };
};

module.exports = getMainMenuEmbed;
