const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const { MessageEmbed } = require('discord.js');
const Fuse = require('fuse.js');

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

// Convert an array of strings to a single string with an Oxford comma.
const oxfordComma = (strings, conjunction = 'and') => {
  if (strings.length === 1) return strings[0];
  if (strings.length === 2) return `${strings[0]} ${conjunction} ${strings[1]}`;
  return `${strings.slice(0, -1).join(', ')}, ${conjunction} ${strings[strings.length - 1]}`;
}

const getItem = async (interaction) => {
  // Refresh this user's items.
  await refreshUserItems(interaction.member.id);

  // Get the item.
  const itemName = interaction.options.getString('item');
  // const item = itemsByOwner[interaction.member.id][letterToNum(itemName)];

  // Use Fuse to search for the item.
  const items = itemsByOwner[interaction.member.id];
  const fuse = new Fuse(items, { ignoreLocation: true, includeScore: true, threshold: 0.2, keys: ['displayName'] });
  const result = fuse.search(itemName);

  if (result.length === 0) {
    interaction.editReply(`You don't have an item called "${itemName}".`);
    return null;
  } else if (result.length > 1) {
    interaction.editReply(
      `Can you be more specific? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    );
    return null;
  }

  return result[0].item;
};

// Set up storage.
const bucket = getStorage().bucket();
// const file = await bucket.file('images/inventory/icon/parts_01.png').download();
// http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon/parts_01.png

// Return a single item to Discord.
const showItem = async (interaction, { ephemeral = false, verbose = false } = {}) => {
  // Defer the reply, just in case.
  await interaction.deferReply({ ephemeral });

  const item = await getItem(interaction);
  if (!item) return; // We're done.

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
        .setName('item')
        .setDescription('The name of the item to examine.')
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
            name: `${index + 1} | ${item.displayName || 'Item'}`,
            value: item.description || 'An interesting item.'
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
        if (!item) return; // We're done.

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
