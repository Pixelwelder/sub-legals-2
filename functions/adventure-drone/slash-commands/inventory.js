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

/**
 * Responds to the thread currently in Redux.
 *
 * @param {Interaction} interaction 
 */
const respond = async (interaction, { ephemeral = true } = {}) => {
  // The reply is always ephemeral, but sometimes we'll add an announcement.
  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.member.id;
  const thread = getSelectors(userId).selectThread(store.getState());
  let response = { content: `No response for ${thread.dialogId}.` };
  let meta = {};

  // Thread should be current, but we load inventory.
  await store.dispatch(inventoryActions.loadData({ userId, toLoad: ['inventory'] }));
  
  const getEmbed = {
    // TODO This will need to be separated so 'show' failures are private.
    [DialogIds.EXAMINE]: getItemEmbed,
    [DialogIds.GIVE]: getGiveItemEmbed,
    [DialogIds.LIST]: getListEmbed
  }[thread.dialogId];

  if (getEmbed) {
    const responseObj = await getEmbed(interaction);
    ({ meta = {}, ...response } = responseObj);
    console.log(responseObj, meta, response);
  }

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
    .setName('inventory')
    .setDescription(`Do stuff with your inventory.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List the items in your inventory.'))
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
    
  // TODO Don't use reply.
  async execute(interaction) {
    const userId = interaction.member.id;
    const command = {
      'list': async () => {
        console.log('list');
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.LIST, data: { ephemeral: true }
        }));
        respond(interaction);
      },

      'examine': async () => {
        // Save location in thread.
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: true }
        }));

        // Get response.
        respond(interaction);
      },

      'show': async () => {
        // Save location in thread.
        await store.dispatch(inventoryActions.saveThread({
          userId, dialogId: DialogIds.EXAMINE, data: { searchString: interaction.options.getString('item'), ephemeral: false }
        }));

        // Get response.
        respond(interaction, { ephemeral: false });
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

        respond(interaction);
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
