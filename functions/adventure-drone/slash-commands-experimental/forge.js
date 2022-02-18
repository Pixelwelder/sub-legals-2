const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getClient } = require('../client');
const wrapArray = require('../../utils/wrapArray');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const store = require('../store');
const { selectors: craftSelectors, actions: craftActions } = require('../store/craft');
const DialogIds = require('../data/DialogIds');
const ItemTypes = require('../data/ItemTypes');
const DroneSchematic = require('../data/DroneSchematic');
const ConstructionProject = require('../data/ConstructionProject');
const capitalize = require('../../utils/capitalize');
const pluralize = require('../../utils/pluralize');
const createParts = require('./forge/createParts');
const sortByType = require('../../utils/sortByType');
const Thread = require('../data/Thread');
const getButtonGrid = require('../../utils/getButtonGrid');
const getMainMenuEmbed = require('./forge/getMainMenuEmbed');
const getSchematicEmbed = require('./forge/getSchematicEmbed');
const getImage = require('./forge/getImage');

const { dispatch } = store;
// -----------------------------------------------------------------------------




// -----------------------------------------------------------------------------


const getAbort = (userId, response = {}) => {
  getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).delete();
  return { embeds: [], components: [], content: 'The Nanoforge has encountered a catastrophic error. Please try again.', ...response };
};

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
}

const getResponse = (userId) => {
  const { thread } = craftSelectors.select(store.getState())[userId];
  console.log('getResponse', thread.dialogId);

  const embedFactory = {
    [DialogIds.MAIN_MENU]: getMainMenuEmbed,
    [DialogIds.SCHEMATIC]: getSchematicEmbed,
    [DialogIds.LIST]: getListEmbed,
    [DialogIds.EXAMINE]: getExamineEmbed,
  }[thread.dialogId];

  if (embedFactory) return embedFactory(userId);
  return getAbort(userId, { content: `No embed factory for ${thread.dialogId}.` });
};

// const getThread = async (id) => {
//   // Do we have an in-flight UI thread?
//   let threadRef = getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(id);
//   const threadDoc = await threadRef.get();
//   return threadDoc.exists ? threadDoc.data() : new Thread();
// };

// const getInventory = async (id) => {
//   const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', id).get();
//   return inventoryDocs.size > 0 ? inventoryDocs.docs.map(doc => doc.data()) : [];
// };

const respond = async (interaction) => {
  const userId = interaction.member.id;
  // const {
  //   thread: _thread,
  //   inventory: _inventory,
  //   id: _id
  // } = state;

  // const id = _id || interaction.member.id;
  // const thread = _thread || await getThread(id);
  // const inventory = _inventory || await getInventory(id);
  const response = await getResponse(userId);
  // console.log('RESPONSE', response);
  await interaction.editReply(response);

  // ------------------------------- HANDLERS ------------------------------------
  const filterButtons = i => i.user.id === userId;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time: 30 * 1000 });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Create new state.
    const { thread } = craftSelectors.select(store.getState())[userId];

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });
    
    console.log('button', customId);
    if (customId.startsWith('goto-')) {
      const [, dialogId] = customId.split('-');
      const newThread = { ...thread, dialogId };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      respond(interaction);

    } else if (customId.startsWith('list-')) {
      const [, page, itemIndex, itemTypesString] = customId.split('-');
      const itemTypes = itemTypesString.split(',');
      const newThread = { ...thread, dialogId: DialogIds.LIST, data: { ...thread.data, itemIndex: Number(itemIndex), itemTypes, itemPage: Number(page) } };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      const { thread: thread2 } = craftSelectors.select(store.getState())[userId];
      console.log('new thread', thread2);
      
      respond(interaction);

    } else if (customId.startsWith('schematic-')) {
      const [, schematicUid] = customId.split('-');
      const newThread = { ...thread, dialogId: DialogIds.SCHEMATIC, data: { ...thread.data, schematicUid } };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      respond(interaction);
    
    } else if (customId.startsWith('item-')) {
      const [, itemUid] = customId.split('-');
      const { itemIndex } = thread.data;

      console.log('installing', itemUid, itemIndex);
      // Install the item in the construction project.
      const newConstructionProject = { ...thread.data.constructionProject, partUids: [...thread.data.constructionProject.partUids] };
      newConstructionProject.partUids[itemIndex] = itemUid;
      await store.dispatch(craftActions.saveData({
        userId,
        data: {
          thread: {
            ...thread, 
            test: itemUid,
            data: {
              ...thread.data,
              constructionProject: newConstructionProject
            },
            dialogId: DialogIds.SCHEMATIC
          }
        }
      }))
      respond(interaction);

    } else if (customId === 'forge') {
      console.log('forging');
      const { payload } = await dispatch(craftActions.forge({ userId }));
      console.log('forge payload', payload);

      if (payload.success) {
        // Show the new item.
        const newThread = new Thread({ dialogId: DialogIds.EXAMINE, data: { itemUid: payload.newItem.uid } });
        console.log('new thread', newThread);
        await dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
        respond(interaction);
      }

    } else if (customId.startsWith('page-')) {
      const [, name, page] = customId.split('-');
      const newThread = { ...thread, data: { ...thread.data, [`${name}Page`]: Number(page) } };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      respond(interaction);

    } else if (customId === 'shutdown') {
      console.log('shutting down');
      await dispatch(craftActions.saveData({ userId, data: { thread: new Thread() } }));
      await interaction.editReply({ embeds: [], components: [], content: 'The forge has powered down.' });

    } else {
      console.error('no button match', customId);
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
      // Out of time. Clear the response.
      await interaction.editReply({ embeds: [], components: [], content: 'The forge has powered down.' });
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forge')
    .setDescription(`Create an item on the Nanoforge.`)
      .addSubcommand(subcommand => subcommand
        .setName('start')
        .setDescription('Start forging an item.'))
      .addSubcommand(subcommand => subcommand
        .setName('setup')
        .setDescription('Create test items.'))
      .addSubcommand(subcommand => subcommand
        .setName('reset')
        .setDescription('Reset a user\'s forging state.')
        .addUserOption(option => option
          .setName('resident')
          .setDescription('The station resident to to reset.')
          .setRequired(true)
        )),

  async execute(interaction, character) {
    const command = {
      start: async () => {
        await interaction.deferReply({ ephemeral: true });

        // Load the user data.
        await store.dispatch(craftActions.loadData({ userId: interaction.member.id }));

        // Respond.
        respond(interaction);
      },
      setup: async () => {
        await interaction.deferReply({ ephemeral: true });
        await createParts(interaction);
      },
      reset: async () => {
        await interaction.deferReply({ ephemeral: true });
        const { id } = interaction.options.getUser('resident');
        await store.dispatch(craftActions.resetUser({ userId: id }));
        await interaction.editReply({ content: `Reset <@${id}>'s crafting state.` });
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (error) {
        console.error(error);
        await interaction.editReply({ content: 'Something exploded.' });
      }
    }
  }
};
