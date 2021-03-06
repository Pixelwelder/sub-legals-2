const { SlashCommandBuilder } = require('@discordjs/builders');
const store = require('../store');
const { selectors: craftSelectors, actions: craftActions } = require('../store/craft');
const DialogIds = require('../data/DialogIds');
const createParts = require('./forge/createParts');
const Thread = require('../data/Thread');
const getMainMenuEmbed = require('./forge/getMainMenuEmbed');
const getSchematicEmbed = require('./forge/getSchematicEmbed');
const getAbort = require('./forge/getAbort');
const getListEmbed = require('./forge/getListEmbed');
const getExamineEmbed = require('./forge/getExamineEmbed');

const { dispatch } = store;

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

const respond = async (interaction) => {
  // ------------------------------- RENDER ------------------------------------
  const userId = interaction.member.id;
  const response = await getResponse(userId);
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
    try {
      await i.update({ components: [] });
    } catch (error) {
      console.log('-------------------------', error);
    }
    
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
      const { payload = {}, error } = await dispatch(craftActions.forge({ userId }));
      console.log('forge payload', payload, error);

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
        .setDescription('Create a few test items for yourself.'))
      .addSubcommand(subcommand => subcommand
        .setName('reset')
        .setDescription(`If you're having issues with forging, try resetting.`)),

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
        const userId = interaction.member.id;
        await store.dispatch(craftActions.resetUser({ userId }));
        await interaction.editReply({ content: `Reset <@${userId}>'s crafting state.` });
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
