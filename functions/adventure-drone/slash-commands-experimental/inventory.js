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

// Each user may have an observable running. We always kill it if it exists.
let unsubscribesByUserId = {
  // [userId]: () => {}
};

// The user might be in the middle of another interaction. If so, and we can find it, we kill it.
let interactionIdsByUserId = {
  // [userId]: [<channelId>, <interactionId>]
};

/**
 * Responds to the thread currently in Redux.
 *
 * @param {Interaction} interaction 
 */
const respond = async (interaction, { ephemeral = true } = {}) => {
  console.log('RESPOND', interaction.id);

  const userId = interaction.member.id;
  const thread = getSelectors(userId).selectThread(store.getState());
  let response = { content: `No response for ${thread.dialogId}.` };
  let meta = {};

  // Thread should be current, but we load inventory.
  await store.dispatch(inventoryActions.loadData({
    userId, interactionId: interaction.id, toLoad: ['inventory']
  }));
  
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

  // Save.
  interactionIdsByUserId[userId] = [interaction.channel.id, interaction.id];

  if (ephemeral || !meta.success) {
    await interaction.editReply(response);
  } else {
    // Send a message to the interaction's channel.
    await interaction.editReply({ content: 'Done.', embed: [], components: [] });
    await interaction.channel.send(response);
  }
};

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
    
  async execute(interaction) {
    console.log('EXECUTE', interaction.id);

    // The reply is always ephemeral, but sometimes we'll add an announcement.
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.member.id;
    const interactionId = interaction.id;

    // Grab the thread immediately. Since we don't know what user this is, we always have to load it.
    await store.dispatch(inventoryActions.loadData({ toLoad: ['thread'], userId, interactionId }));
    let thread = getSelectors(userId).selectThread(store.getState());

    // Are we in the current thread?
    if (thread.interactionId !== interactionId) {
      // No, we're not.
      console.log('Not in current thread:', thread.interactionId, interactionId);
      await store.dispatch(inventoryActions.saveThread({ userId, interactionId }));

      // Unsubscribe.
      if (unsubscribesByUserId[userId]) {
        console.log('unsubscribing', userId);
        unsubscribesByUserId[userId]();
        delete unsubscribesByUserId[userId];
      } else {
        console.log('nothing to unsubscribe', userId);
      }

      // Kill interaction.
      // if (interactionIdsByUserId[userId]) {
      //   const [oldChannelId, oldInteractionId] = interactionIdsByUserId[userId];
      //   console.log('killing last interaction for', userId, oldChannelId, oldInteractionId);

      //   const client = getClient();
      //   const channel = await client.channels.cache.get(oldChannelId);
      //   console.log('channel', channel.id);
      //   const messages = await channel.messages.fetch({ around: oldInteractionId, limit: 1 });
      //   console.log('messages', messages);
      //   const message = messages.get(oldInteractionId);
      //   console.log('\n\nmessage', message);
      //   await message.edit({ content: 'Cancelled.', embed: [], components: [] });
      //   console.log('old message deleted?');
        
      //   delete interactionIdsByUserId[userId];
      // } else {
      //   console.log('no existing interaction');
      // }
    }

    // Grab the thread again.
    thread = getSelectors(userId).selectThread(store.getState());
    unsubscribesByUserId[userId] = observeStore(store, getSelectors(userId).selectThread, async (thread) => {
      console.log(userId, 'observes change', thread.dialogId);
      if (interaction.id === thread.interactionId) {
        console.log(' +++ USER HAS NAVIGATED +++', thread.dialogId, thread.interactionId);
        await respond(interaction);
      }
    });
    
    const command = {
      'list': async () => {
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.LIST, data: { ephemeral: true }
        }));
        // respond(interaction);
      },

      'examine': async () => {
        // Save location in thread.
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: true }
        }));

        // Get response.
        // respond(interaction);
      },

      'show': async () => {
        // Save location in thread.
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: false }
        }));

        // Get response.
        // respond(interaction, { ephemeral: false });
      },

      'reset': async () => {
        await store.dispatch(inventoryActions.resetUser({ userId }));
        // respond(interaction);
      },

      // Give the inventory item to another user.
      'give': async () => {
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.GIVE, data: {
            searchString: interaction.options.getString('item'),
            resident: interaction.options.getUser('resident').id,
            ephemeral: true
          }
        }));

        // respond(interaction);
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (e) {
        console.error(e);
        interaction.editReply('Oops, something went wrong.');
      } finally {
        console.log('Command complete');
      }
    }
  }
}
