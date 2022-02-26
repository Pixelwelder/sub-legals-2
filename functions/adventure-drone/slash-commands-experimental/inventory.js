const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, CommandInteractionOptionResolver } = require('discord.js');
const Fuse = require('fuse.js');
const oxfordComma = require('../../utils/oxfordComma');
const { actions: inventoryActions, getSelectors } = require('../store/inventory');
const store = require('../store');
const ItemTypes = require('../data/ItemTypes');
const getItemEmbed = require('./inventory/getItemEmbed');
const getGiveItemEmbed = require('./inventory/getGiveItemEmbed');
const getListEmbed = require('./inventory/getListEmbed');
const DialogIds = require('./inventory/DialogIds');
const getDisassembleEmbed = require('./inventory/getDisassembleEmbed');
const observeStore = require('../../utils/observeStore');
const { getClient } = require('../client');

const timeoutSecs = 30;

/**
 * Responds to the thread currently in Redux.
 *
 * @param {Interaction} interaction 
 */
const respond = async (interaction, { ephemeral = true } = {}) => {
  console.log('\n-------- RESPOND');
  const userId = interaction.member.id;
  const thread = getSelectors(userId).selectThread(store.getState());
  console.log('thread: ', thread);
  let response = { content: `No response for ${thread.dialogId}.`, embeds: [], components: [] };
  let meta = {};

  // Thread should be current, but we load inventory.
  // await store.dispatch(inventoryActions.loadData({
  //   userId, interactionId: interaction.id, toLoad: ['inventory']
  // }));
  
  const getEmbed = {
    // TODO This will need to be separated so 'show' failures are private.
    [DialogIds.EXAMINE]: getItemEmbed,
    [DialogIds.GIVE]: getGiveItemEmbed,
    [DialogIds.LIST]: getListEmbed,
    [DialogIds.DISASSEMBLE]: getDisassembleEmbed,
  }[thread.dialogId];

  if (getEmbed) {
    const responseObj = await getEmbed(interaction);
    ({ meta = {}, ...response } = responseObj);
  }

  if (ephemeral || !meta.success) {
    await interaction.editReply(response);
  } else {
    // Send a message to the interaction's channel.
    await interaction.editReply({ content: 'Done.', embeds: [], components: [] });
    await interaction.channel.send(response);
  }
};

// Each user may have an observable running. We always kill it if it exists.
const unsubscribesByUserId = {
  // [userId]: () => {}
};

const interactionsByUserId = {
  // [userId]: <interaction>
};

const timeoutsByUserId = {
  // [userId]: <timeout>
};

const expire = async (interaction, { clear = false } = {}) => {
  const userId = interaction.member.id;
  try {
    // When an interaction expires, we simply remove the buttons.
    await interaction.editReply({ components: [] });
  } catch (err) {
    console.error('++ handled: ', err.message);
  }

  delete interactionsByUserId[userId];

  // Kill any existing timeout.
  if (timeoutsByUserId[userId]) {
    clearTimeout(timeoutsByUserId[userId]);
    delete timeoutsByUserId[userId];
  }

  // Kill the observable.
  if (unsubscribesByUserId[userId]) {
    unsubscribesByUserId[userId]();
    delete unsubscribesByUserId[userId];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inv')
    .setDescription(`Do stuff with your inventory.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List the items in your inventory.'))
    .addSubcommand(subcommand => subcommand
        .setName('reset')
        .setDescription('Reset user thread.'))
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine an inventory item.')
      .addStringOption(option => option
        .setName('item')
        .setDescription('The name or number of the item to examine.')
        .setRequired(true)
      ))
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Show an inventory item to the room.')
      .addStringOption(option => option
        .setName('item')
        .setDescription('The name of the item to show.')
        .setRequired(true)
      ))
    .addSubcommand(subcommand => subcommand
      .setName('give')
      .setDescription('Give an inventory item to another user.')
      .addStringOption(option => option
        .setName('item')
        .setDescription('The name of the item to give.')
        .setRequired(true))
      .addUserOption(option => option
        .setName('resident')
        .setDescription('The station resident to give the item to.')
        .setRequired(true)
      )),
      // .addSubcommand(subcommand => subcommand
      //   .setName('disassemble')
      //   .setDescription('Disassembled an item.')
      //   .addStringOption(option => option
      //     .setName('item')
      //     .setDescription('The name or number of the item to disassemble.')
      //     .setRequired(true)
      // )),
    
  async execute(interaction) {
    console.log('EXECUTE', interaction.id);
    const userId = interaction.member.id;
    const interactionId = interaction.id;

    // The reply is always ephemeral, but sometimes we'll add an announcement.
    // Give us some time to think without timing out.
    await interaction.deferReply({ ephemeral: true });

    // The user may have an active interaction. We kill that first.
    const existingInteraction = interactionsByUserId[userId];
    if (existingInteraction) {
      await expire(existingInteraction);
    }

    // ---------------------------------------------- SETUP ----------------------------------------------
    // Now save _this_ interaction so we can expire it later if necessary.
    interactionsByUserId[userId] = interaction;

    // Set up a timeout so we can expire this interaction if it takes too long.
    timeoutsByUserId[userId] = setTimeout(async () => {
      expire(interaction);
    }, timeoutSecs * 1000);

    // Listen to the store for this interaction.
    unsubscribesByUserId[userId] = observeStore(store, getSelectors(userId).selectDialogId, async (dialogId, old) => {
      console.log('dialogId', old, '-->', dialogId);
      if (dialogId > -1) {
        console.log(userId, 'observes change', dialogId);
        await respond(interaction);
      }
    });

    // Initialize user.
    await store.dispatch(inventoryActions.initialize({ userId }));

    // ---------------------------------------------- RESPOND ----------------------------------------------
    const saveThread = inventoryActions.saveThread2;
    
    const command = {
      'list': async () => {
        const thread = getSelectors(userId).selectThread(store.getState());
        console.log('list thread: ', thread);
        await store.dispatch(saveThread({
          userId, dialogId: DialogIds.LIST, data: { ephemeral: true }
        }));
      },

      'examine': async () => {
        await store.dispatch(saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: true }
        }));
      },

      'show': async () => {
        await store.dispatch(saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: false }
        }));
      },

      'reset': async () => {
        await store.dispatch(resetUser({ userId }));
      },

      'give': async () => {
        await store.dispatch(saveThread({
          userId, dialogId: DialogIds.GIVE, data: {
            searchString: interaction.options.getString('item'),
            resident: interaction.options.getUser('resident').id,
            ephemeral: true
          }
        }));
      },

      // 'disassemble': async () => {
      //   await store.dispatch(inventoryActions.saveThread({
      //     userId, dialogId: DialogIds.DISASSEMBLE, data: {
      //       searchString: interaction.options.getString('item'),
      //       ephemeral: true
      //     }
      //   }));

      //   // respond(interaction);
      // }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (e) {
        console.error(e);
        interaction.editReply('Oops, something went wrong. Try again?');
      } finally {
        console.log('Command complete');
      }
    }
  }
}
