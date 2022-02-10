const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed } = require('discord.js');
const Fuse = require('fuse.js');

// Create an array of emojis, one for each letter.
const emojis = [
  '🅰', '🅱', '🅲', '🅳', '🅴', '🅵', '🅶', '🅷', '🅸', '🅹', '🅺', '🅻', '🅼', '🅽', '🅾', '🅿', '🆀', '🆁', '🆂', '🆃', '🆄', '🆅', '🆆', '🆇', '🆈', '🆉'
];
// TODO Handle numbers above 26.
const numToLetter = (num) => String.fromCharCode(0x41 + num);
const letterToNum = (letter) => letter.toUpperCase().charCodeAt(0) - 0x41;
const numToLetterEmoji = (num) => emojis[Math.min(num, 25)];

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';
const defaultImage = 'parts_01.png';
const getImage = (item, paramName = 'image') => {
  const { image: { [paramName]: url = defaultImage } = {} } = item;
  return `${imageRoot}/${url}`;
}

// When we load, we grab all items from the database. This is probably not scalable.
const itemsByOwner = {}
const refreshUserItems = async (userId) => {
  const items = await getFirestore().collection('discord_inventory').where('player', '==', userId).get();
  itemsByOwner[userId] = items.docs.map(doc => doc.data());
};

const getItem = async (interaction) => {
  // Refresh this user's items.
  await refreshUserItems(interaction.member.id);

  // Get the item.
  const letter = interaction.options.getString('letter');
  const item = itemsByOwner[interaction.member.id][letterToNum(letter)];

  // Use Fuse to search for the item.
  const items = itemsByOwner[interaction.member.id];
  const fuse = new Fuse(items, { ignoreLocation: true, includeScore: true, threshold: 0.2, keys: ['displayName'] });
  const result = fuse.search(letter.replace(' ', ''));

  return result;
};

// Set up storage.
const bucket = getStorage().bucket();
// const file = await bucket.file('images/inventory/icon/parts_01.png').download();
// http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon/parts_01.png

// Return a single item to Discord.
const showItem = async (interaction, { ephemeral = false, verbose = false } = {}) => {
  // Defer the reply, just in case.
  await interaction.deferReply({ ephemeral });

  let item;
  const items = await getItem(interaction);
  switch (items.length) {
    case 0:
      interaction.editReply('You don\'t have that item.');
      break;

    case 1:
      ({ item } = items[0]);
      break;

    default:
      // We found more than one.
      interaction.editReply(`Can you be more specific? That could describe ${items.length} items.`);
      break;
  }
  
  // Send it.
  let title = item.displayName;
  if (!ephemeral) title = `${title} (owned by ${interaction.user.username})`
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(title)

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
  } else {
    description = item.description;
  }

  if (description) embed.setDescription(description);
  if (!image) image = getImage(item, 'x1Url');
  embed.setImage(image);

  interaction.editReply({ embeds: [embed] });
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
        .setName('letter')
        .setDescription('The letter of the item (A, B, C, etc.) to examine.')
        .setRequired(true)
      ))
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Show an inventory item to the room.')
      .addStringOption(option => option
        .setName('letter')
        .setDescription('The letter of the item (A, B, C, etc.) to show.')
        .setRequired(true)
      ))
    .addSubcommand(subcommand => subcommand
      .setName('give')
      .setDescription('Give an inventory item to another user.')
      .addStringOption(option => option
        .setName('letter')
        .setDescription('The letter of the item (A, B, C, etc.) to give.')
        .setRequired(true)
      )
      .addUserOption(option => option
        .setName('resident')
        .setDescription('The station resident to give the item to.')
        .setRequired(true)
      )),
    
  // TODO Don't use reply.
  async execute(interaction) {
    const command = {
      'list': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply({ ephemeral: true });

        // Refresh user items.
        await refreshUserItems(interaction.member.id);
        const items = itemsByOwner[interaction.member.id];

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`${interaction.user.username}'s Inventory`);

        const fields = items.map((item, index) => {
          return {
            name: `${numToLetterEmoji(index)} | ${item.displayName || 'Item'}`,
            value: item.description || 'An interesting item.'
          };
        });

        if (fields.length) {
          embed.addFields(fields);
        } else {
          embed.setDescription('You don\'t have any items.');
        }

        await interaction.editReply({ embeds: [embed] });
      },

      'examine': async () => {
        await showItem(interaction, { verbose: true, ephemeral: true });
      },

      'show': async () => {
        await showItem(interaction, { verbose: false, ephemeral: false });
      },

      // Give the inventory item to another user.
      'give': async () => {
        // Do NOT defer the reply.
        await interaction.deferReply({ ephemeral: true });

        // Get the item
        const item = await getItem(interaction);
        if (!item) {
          interaction.editReply('You don\'t have that item.' );
          return;
        }

        // Get the target user.
        const { id } = interaction.options.getUser('resident');

        // Make the transfer.
        await getFirestore().collection('discord_inventory').doc(item.uid).update({ player: id });

        // Announce the transfer.
        interaction.editReply(`You gave <@${id}> ${item.displayName || 'an item'}.`);
        interaction.channel.send(`<@${id}> has received <@${interaction.user.id}>'s ${item.displayName || 'item'}!`, { ephemeral: false });
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
