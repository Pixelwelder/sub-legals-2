const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed } = require('discord.js');

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
const getImage = item => {
  const { image: { x1Url = defaultImage } } = item;
  return `${imageRoot}/${x1Url}`;
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

  return item;
};

// Set up storage.
const bucket = getStorage().bucket();
// const file = await bucket.file('images/inventory/icon/parts_01.png').download();
// http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon/parts_01.png

// Return a single item to Discord.
const showItem = async (interaction, { ephemeral } = {}) => {
  // Defer the reply, just in case.
  await interaction.deferReply();

  const item = await getItem(interaction);
  if (!item) {
    interaction.editReply('You don\'t have that item.', { ephemeral: true });
    return;
  }

  // Send it.
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`${item.displayName} (owned by <@${interaction.user.id}>)`)
    .addField('Description', item.description || 'An interesting item.', true)
    .setImage(getImage(item));

  interaction.editReply({ embeds: [embed], ephemeral });
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
        await interaction.deferReply();

        // Refresh user items.
        await refreshUserItems(interaction.member.id);
        const items = itemsByOwner[interaction.member.id];

        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`<@${interaction.user.id}>'s Inventory`);

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

        await interaction.editReply({ embeds: [embed], ephemeral: true });
      },

      'examine': async () => {
        await showItem(interaction);
      },

      'show': async () => {
        await showItem(interaction, { ephemeral: true });
      },

      // Give the inventory item to another user.
      'give': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply();

        // Get the item
        const item = await getItem(interaction);
        if (!item) {
          interaction.editReply('You don\'t have that item.', { ephemeral: true });
          return;
        }

        // Get the target user.
        const { id } = interaction.options.getUser('resident');

        console.log('the item', item);

        // Make the transfer.
        await getFirestore().collection('discord_inventory').doc(item.uid).update({ player: id });

        // Announce the transfer.
        interaction.editReply(`<@${id}> has received <@${interaction.user.id}>'s ${item.displayName || 'item'}!`, { ephemeral: false });
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (e) {
        console.error(e);
        interaction.editReply('Oops, something went wrong.', { ephemeral: true });
      } finally {
        console.log('Command complete');
      }
    }
  }
}
