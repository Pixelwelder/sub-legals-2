const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed, MessageActionRow, MessageButton, CommandInteractionOptionResolver } = require('discord.js');
const Fuse = require('fuse.js');
const { getClient } = require('../client');
const getStatFields = require('../../utils/getStatFields');
const oxfordComma = require('../../utils/oxfordComma');
const { actions: inventoryActions, getSelectors } = require('../store/inventory');
const store = require('../store');
const ItemTypes = require('../data/ItemTypes');
const getItemEmbed = require('./inventory/getItemEmbed');
const DialogIds = require('./inventory/DialogIds');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';
const defaultImage = 'parts_01.png';
const getImage = (item, paramName = 'image') => {
  // const { image: { [paramName]: url = defaultImage } = {} } = item;
  const { image: url = defaultImage } = item;
  return `${imageRoot}/${url}`;
}

const getItem = async (interaction) => {
  // Refresh this user's items.
  const userId = interaction.member.id;
  await store.dispatch(inventoryActions.loadData({ userId }));
  const items = getSelectors(userId).selectInventory(store.getState());

  // Get the item.
  // The user may search by name or index.
  const item = interaction.options.getString('item');
  const number = parseInt(item);
  const result = [];
  if (isNaN(number)) {
    // it's a name.
    const fuse = new Fuse(items, { ignoreLocation: true, includeScore: true, threshold: 0.2, keys: ['displayName'] });
    result.push(...fuse.search(item));
  } else {
    // it's an index.
    const index = number - 1;
    if (items.length > index) result.push({ item: items[index] });
  }

  if (result.length === 0) {
    interaction.editReply(`You don't have an item called "${item}".`);
    return null;
  } else if (result.length > 1) {
    interaction.editReply(
      `Can you be more specific or use a number? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    );
    return null;
  }

  return result[0].item;
};

const getMinionEmbed = async (interaction, { ephemeral = false, verbose = false } = {}) => {

};

// Return a single item to Discord.
const showItem = async (interaction, { ephemeral = false, verbose = false } = {}) => {
  // Defer the reply, just in case.
  await interaction.deferReply({ ephemeral });

  const userId = interaction.member.id;
  const item = await getItem(interaction);
  if (!item) return; // We're done.

  let title = item.displayName;
  if (!ephemeral) title = `${title} (owned by ${interaction.user.username})`
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(title)
  const components = [];

  let description;
  let image;
  if (verbose) {
    // Inventory items may have a content property like so: { image: '', fields: [{ name, value }, ...] }
    const { data = {} } = item;
    const { fields } = data;
    if (fields) {
      fields.forEach(({ name, value, inline = false }) => embed.addField(name, value, inline));
    } else {
      description = item.description;
    }
    if (data.image) image = getImage({ image: data });

    // The owner can do things with the item.
    if (item.player === userId) {
      const actionRow = new MessageActionRow();
      
      if (item.type == ItemTypes.MINION) {
        actionRow.addComponents(
          new MessageButton()
            .setCustomId('Explore')
            .setLabel('Explore')
            .setStyle('PRIMARY')
        )
      }
      components.push(actionRow);
    }
  } else {
    description = item.description;
  }

  // Check for data.
  const { data = {} } = item;
  const { stats, statModifiers } = data;
  
  if (statModifiers) {
    const statString = Object.entries(statModifiers).reduce((acc, [_name, _value], index) => {
      const name = capitalize(_name);
      const value = _value > 1 ? `+${_value}` : _value;
      const string = `${value} ${name}`;
      return acc ? `${acc}, ${string}` : string;
    }, '');
    // if (statFields.length > 0) embed.addFields(statFields);
    description = `${description}\n\n${statString}`;
  }

  if (stats) {
    const fields = getStatFields(stats);
    console.log('FIELDS', fields);
    embed.addFields(fields);
  }

  if (description) embed.setDescription(description);
  if (!image) image = getImage(item, 'x1Url');
  embed.setImage(image);

  interaction.editReply({ embeds: [embed], components });
};

/**
 * Always returns the complete response to deliver to Discord, e.g. { content, embeds, components }.
 *
 * @param {string} userId 
 * @returns 
 */
const getResponse = async (userId) => {
  const thread = getSelectors(userId).selectThread(store.getState());
  console.log('THREAD', thread);

  return { content: '...' };
};

/**
 * Always responds to the information in Redux.
 *
 * @param {Interaction} interaction 
 */
const respond = async (interaction) => {
  const userId = interaction.member.id;

  // Defer reply.
  // TODO We need a good way to determine ephemeral.
  await interaction.deferReply({ ephemeral: true });

  // Load items and thread.
  await store.dispatch(inventoryActions.loadData({ userId }));

  // Get response.
  const response = await getResponse(userId);
  await interaction.editReply(response);

  // ---------------------------------------------------- LISTENERS ----------------------------------------------------
  // Listen for user interaction.
  // const responseFactories = {

  // };

  // const responder = 
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inv')
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
        .setRequired(true)
      )
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
        await interaction.deferReply({ ephemeral: true });
        await store.dispatch(inventoryActions.loadData({ userId }));
        const items = getSelectors(userId).selectInventory(store.getState());

        // Refresh user items.
        // await refreshUserItems(interaction.member.id);
        // const items = itemsByOwner[interaction.member.id];

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`${interaction.user.username}'s Inventory`);

        const fields = items.map((item, index) => {
          return {
            name: `${item.displayName || 'Item'} ${item.type ? '\`' + item.type.toUpperCase() + '\`' : ''}`,
            value: `**${index + 1}** | ${item.description || 'An interesting item.'}`
          };
        });

        if (fields.length) {
          embed.addFields(fields);
          embed.setDescription('You can use `/inventory examine <item name>` to examine an item.');
        } else {
          embed.setDescription('You don\'t have any items.');
        }

        await interaction.editReply({ embeds: [embed] });
      },

      'examine': async () => {
        // Save location in thread.
        console.log('examine');
        await store.dispatch(inventoryActions.saveThread({ userId, dialogId: DialogIds.EXAMINE }));

        // Get response.
        console.log('getting response');
        respond(interaction);
      },

      'show': async () => {
        await showItem(interaction, { verbose: false, ephemeral: false });
      },

      // Give the inventory item to another user.
      'give': async () => {
        await interaction.deferReply({ ephemeral: true });

        // Get the item
        const item = await getItem(interaction);
        if (!item) return; // We're done.

        // Get the target user.
        const { id } = interaction.options.getUser('resident');

        // Make the transfer.
        await getFirestore().collection('discord_inventory').doc(item.uid).update({ player: id });

        // Announce the transfer.
        // TODO This should be private to both parties... somehow. Maybe a DM for the recipient?
        interaction.editReply(`You gave <@${id}> ${item.displayName || 'an item'}.`);
        interaction.channel.send(`<@${id}> has received <@${interaction.user.id}>'s ${item.displayName || 'item'}!`, { ephemeral: false });

        // Is it this bot?
        if (id === getClient().user.id) {
          // TODO
        }
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
