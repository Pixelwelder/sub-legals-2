const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getClient } = require('../client');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');

const time = 30 * 1000;

const Progress = {
  MAIN_MENU: 0,
  MINION: 1
};

function Thread() {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    progress: 0
  };
}

// Used to craft an item.
function Schematic(overrides) {
  return new PersonalInventoryItem({
    type: ItemTypes.SCHEMATIC,
    displayName: 'Schematic',
    ...overrides
  });
}

const ItemTypes = {
  SCHEMATIC: 'schematic',
  CHASSIS: 'chassis',
  CORE: 'core',
  SENSOR: 'sensor',
  DRIVETRAIN: 'drivetrain',
  TOOL: 'tool'
};

function DroneSchematic(overrides) {
  return new Schematic({
    displayName: 'Generic Drone',
    data: {
      parts: [
        { type: 'type', includes: [ItemTypes.CHASSIS] },
        { type: 'type', includes: [ItemTypes.CORE] },
        { type: 'type', includes: [ItemTypes.SENSOR] },
        { type: 'type', includes: [ItemTypes.DRIVETRAIN] },
        { type: 'type', includes: [ItemTypes.TOOL] }
      ]
    },
    ...overrides
  });
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const adminId = '685513488411525164';
const TEMP_createParts = async (interaction) => {
  // Create a bunch of parts in firestore and give them all to USKillbotics (685513488411525164).
  const firestore = getFirestore();
  [ItemTypes.CHASSIS, ItemTypes.CORE, ItemTypes.SENSOR, ItemTypes.DRIVETRAIN, ItemTypes.TOOL]
    .forEach(async type => {
      const doc = getFirestore().collection('discord_inventory').doc();
      const item = new PersonalInventoryItem({
        uid: doc.id,
        player: adminId,
        type,
        displayName: `${capitalize(type)} ${Math.floor(Math.random() * 100)}`,
        description: 'Looks pretty beat up.',
        image: 'parts_13.png'
      });
      await doc.set(item);
    });

  // Create schematic.
  const doc = getFirestore().collection('discord_inventory').doc();
  const item = new DroneSchematic({
    displayName: 'Random Drone',
    uid: doc.id,
    player: adminId,
    image: `parts_${Math.floor(Math.random() * 45)}.png`
  });
  await doc.set(item);
  interaction.editReply('Test items created.');
};

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/discord/ui';
const getImage = ({ progress }) => {
  return `${imageRoot}/nanoforge.jpg`;
};

const getMainMenuEmbed = ({ thread, inventory }) => {
  
  console.log('getMainMenuEmbed', inventory.length);
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | ONLINE')
    .setDescription('What would you like to craft?')
    .setImage(getImage(thread));

  // Add a button for each inventory item of type SCHEMATIC.
  // TODO IMPORTANT Wrap at 5.
  const components = [];
  const schematics = inventory.filter(item => item.type === ItemTypes.SCHEMATIC);
  if (schematics.length) {
    const actionRow = new MessageActionRow();
    const buttons = schematics.map(schematic => {
      return new MessageButton()
        .setCustomId(schematic.uid)
        .setLabel(schematic.displayName)
        .setStyle('SECONDARY');
    });
    actionRow.addComponents(buttons);
    components.push(actionRow);
  }

  return { embeds: [embed], components };
};

const getMinionEmbed = ({ thread }) => {
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | CREATE MINION')
    .setImage(getImage(thread));

    const actionRow = new MessageActionRow();
    const buttons = [
      new MessageButton()
        .setCustomId('back-to-main-menu')
        .setLabel('< Back')
        .setStyle('SECONDARY')
    ];

    // Creating a minion requires five components: one in each of the following categories:
    // - Chassis
    // - Core
    // - Tool
    // - Sensor
    // - Drivetrain

  
    actionRow.addComponents(buttons);
  
    return { embeds: [embed], components: [actionRow] };
};

const getResponse = (state) => {
  const embedFactory = {
    [Progress.MAIN_MENU]: getMainMenuEmbed,
    [Progress.MINION]: getMinionEmbed
  }[state.thread.progress];

  if (embedFactory) return embedFactory(state);
};

const getThread = async (id) => {
  // Do we have an in-flight UI thread?
  let threadRef = getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(id);
  const threadDoc = await threadRef.get();
  return threadDoc.exists ? threadDoc.data() : new Thread();
};

const getInventory = async (id) => {
  const inventoryDocs = await getFirestore().collection('discord_inventory').where('player', '==', id).get();
  return inventoryDocs.size > 0 ? inventoryDocs.docs.map(doc => doc.data()) : [];
};

const respond = async (interaction, state = {}) => {
  const {
    thread: _thread,
    inventory: _inventory
  } = state;

  const thread = _thread || await getThread(interaction.member.id);
  const inventory = _inventory || await getInventory(interaction.member.id);
  const newState = { thread, inventory };
  const response = getResponse(newState);
  interaction.editReply(response);

  // ------------------------------- HANDLERS ------------------------------------
  const filterButtons = i => i.user.id === interaction.member.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });

    switch (customId) {
      case 'minion': {
        // Save thread progress.
        const newThread = { ...thread, progress: Progress.MINION, updated: new Date().getTime() };
        await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        respond(interaction, { ...newState, thread: newThread });
        break;
      }

      case 'back-to-main-menu': {
        const newThread = { ...thread, progress: Progress.MAIN_MENU, updated: new Date().getTime() };
        await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        respond(interaction, { ...newState, thread: newThread });
        break;
      }

      default: {
        // TODO Reset?
        break;
      }
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
    .setName('craft')
    .setDescription(`Craft an item.`)
      .addSubcommand(subcommand => subcommand
        .setName('start')
        .setDescription('Start crafting an item.'))
      .addSubcommand(subcommand => subcommand
        .setName('test')
        .setDescription('Create test items.')),

  async execute(interaction, character) {
    const command = {
      start: async () => {
        await interaction.deferReply({ ephemeral: true });
        respond(interaction);
      },
      test: async () => {
        await interaction.deferReply({ ephemeral: true });
        await TEMP_createParts(interaction);
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      await command();
    }
  }
};
