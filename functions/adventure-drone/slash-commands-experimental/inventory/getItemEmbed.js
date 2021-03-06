const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const getStatFields = require('../../../utils/getStatFields');
const getStatModifiers = require('../../../utils/getStatModifiers');
const ItemTypes = require('../../data/ItemTypes');
const oxfordComma = require('../../../utils/oxfordComma');
const { getClient } = require('../../client');
const { getFirestore } = require('firebase-admin/firestore');
const DialogIds = require('./DialogIds');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const ButtonIds = {
  GIVE: 'give',
  EXPLORE: 'explore',
  DISASSEMBLE: 'disassemble'
};

const getDescription = (item) => {
  let description = item.description || '';
  if (item.data.statModifiers) description = `${description}\n\n${getStatModifiers(item.data.statModifiers)}`;

  return description;
};

const getImage = (item, { ephemeral = true } = {}) => {
  let image = item.image || 'parts_14.png';
  // If ephemeral, override with the inner image.
  if (ephemeral) {
    if (item.data.image) image = item.data.image;
  }
  
  return `${imageRoot}/${image}`;
};

const getError = (errorString, overrides = {}) => {
  return { meta: { success: false }, content: errorString, ...overrides };
}

const getItemEmbed = async (interaction) => {
  const userId = interaction.member.id;
  const { data: { searchString = '', ephemeral } } = getSelectors(userId).selectThread(store.getState());
  const items = getItems({ userId, searchString });

  if (items.length === 0) {
    return getError(`You don't have an item called "${searchString}".`);
  } else if (items.length > 1) {
    return getError(
      `Can you be more specific or use a number? That could describe ${oxfordComma(items.map((item) => `**${item.displayName}**`), 'or')}.`
    )
  }

  const [item] = items;
  const {
    displayName, image, player,
    data: { stats, statModifiers, fields }
  } = item;

  // Grab the owner from firestore
  const owner = await getFirestore().collection('discord_users').doc(player).get();
  const ownerName = owner.exists ? `${owner.data().displayName}'s` : 'Unowned';

  const isOwned = item.player === userId;
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`${ownerName} ${displayName.toUpperCase()}`);

  // Fields are private.
  if (fields && ephemeral) embed.addFields(fields);
  if (stats) embed.addFields(getStatFields(stats));
  embed.setDescription(getDescription(item));
  embed.setImage(getImage(item, { ephemeral }));
  
  const components = [];
  if (ephemeral) {
    if (isOwned) {
      // Private owner controls
      const actionRow = new MessageActionRow();
      const buttons = [];

      // if (item.type === ItemTypes.MINION) {
      //   buttons.push(
      //     new MessageButton()
      //       .setCustomId(ButtonIds.EXPLORE)
      //       .setLabel('Explore')
      //       .setStyle('PRIMARY')
      //   );
      // }

      if (item.data.schematic) {
        buttons.push(
          new MessageButton()
            .setCustomId(ButtonIds.DISASSEMBLE)
            .setLabel('Disassemble')
            .setStyle('DANGER')
        );
      }

      if (buttons.length) {
        actionRow.addComponents(buttons);
        components.push(actionRow);
      }
    } else {
      // Private controls on others' items.
    }
  } else {
    if (isOwned) {
      // Public owner controls.
    } else {
      // Public controls on others' items.
    }
  }

  // ---------------------------------------------------- HANDLERS ----------------------------------------------------
  // We have a single exit point below, and then several more for this handler.
  const filterButtons = i => i.user.id === userId;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time: 30 * 1000 });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });
    
    console.log('button', customId);
    switch (customId) {
      case ButtonIds.GIVE:
        interaction.editReply({
          content: 'To give this item to another resident, use `/inventory give <item> @<Username>`.'
        });
        break;

      case ButtonIds.EXPLORE:
        break;

      case ButtonIds.DISASSEMBLE:
        await store.dispatch(inventoryActions.saveThread({
          userId,
          dialogId: DialogIds.DISASSEMBLE,
          data: { ephemeral: true, itemUid: item.uid }
        }));

        // Problem: how do I get to respond() in inventory.js?
        // Idea: call it every time the thread changes. But then it doesn't have the interaction.
        
        break;
        // await store.dispatch(inventoryActions.disassemble({ userId, itemId: item.uid }));
        // return { content: `**${displayName}** was disassembled.`, embeds: [], components: [] };

      default:
        // TODO Fail back up the chain? Or at least do the same thing everywhere.
        return getError(`Unknown button ${customId}`, { embeds: [], components: [] } );
    }
  });

  // ------------------------------------------------------------------------------------------------------------------
  return { embeds: [embed], components };
};

module.exports = getItemEmbed;
