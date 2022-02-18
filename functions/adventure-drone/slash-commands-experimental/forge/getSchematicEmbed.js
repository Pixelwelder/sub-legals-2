const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { selectors: craftSelectors, actions: craftActions } = require('../../store/craft');
const store = require('../../store');
const getImage = require('./getImage');
const sortByType = require('../../../utils/sortByType');
const ConstructionProject = require('../../data/constructionProject');
const DialogIds = require('../../data/DialogIds');

const { dispatch } = store;

const getSchematicEmbed = async (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { constructionProject } = data;

  // Grab the schematic.
  const schematic = inventory.find(item => item.uid === data.schematicUid);
  if (!schematic) return getAbort(userId, { content: 'The schematic has disappeared.' });

  // Sort the items into types.
  const itemsByType = sortByType(inventory);
  const getAvailableItems = (options) => {
    return options.reduce((acc, option) => {
      const items = itemsByType[option];
      return items ? [...acc, ...items] : acc;
    }, []);
  };

  // Do we have a construction project?
  if (!constructionProject) {
    // Create a new construction project.
    const constructionProject = new ConstructionProject(schematic);

    // It's possible that we only have one of some categories, in which case we should just assign them to the construction project.
    schematic.data.parts.forEach((partDef, index) => {
      const { displayName, requires, options } = partDef;
      const availableItems = getAvailableItems(options);
      if (availableItems.length === 1) {
        constructionProject.partUids[index] = availableItems[0].uid;
      }
    });

    const newThread = { ...thread, data: { ...thread.data, constructionProject } };
    await dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));

    // TODO Investigate this React-like approach.
    // return { content: 'New construction' };
    return getSchematicEmbed(userId);
  }

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`SCHEMATIC | ${schematic.displayName.toUpperCase()}`)
    .setImage(getImage(thread));

  // Now we go through the required items.
  const partsRow = new MessageActionRow()
    .addComponents(
      schematic.data.parts.map((partDef, index) => {
        const { displayName, requires, options } = partDef;

        // Do we have any of the options?
        const availableItems = getAvailableItems(options);

        // If no item is selected, the button shows the displayName of the part specification.
        // If an item is selected, the button shows the displayName of the item.
        let label = `${partDef.displayName} (${availableItems.length})`;
        let style = 'DANGER';
        const selectedItemId = constructionProject.partUids[index];
        if (selectedItemId) {
          const selectedItem = inventory.find(item => item.uid === selectedItemId);
          label = selectedItem.displayName;
          style = 'SUCCESS';
        }

        return new MessageButton()
          // schematicPage, itemIndex, itemTypesString
          .setCustomId(`list-0-${index}-${options.reduce((acc, option, index) => `${acc}${acc ? ',' : ''}${option}`, '')}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(!availableItems.length);
      })
    );

    let disabled = constructionProject.partUids.includes('');
    const utilityRow = new MessageActionRow()
      .addComponents([
        new MessageButton()
          .setCustomId(`goto-${DialogIds.MAIN_MENU}`)
          .setLabel('< Back')
          .setStyle('SECONDARY'),

        new MessageButton()
          .setCustomId('forge')
          .setLabel('FORGE')
          .setStyle('PRIMARY')
          .setDisabled(disabled)
    ]);
  
    return { embeds: [embed], components: [partsRow, utilityRow] };
};

module.exports = getSchematicEmbed;
