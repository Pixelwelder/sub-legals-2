const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getClient } = require('../client');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const store = require('../store');
const { selectors: craftSelectors, actions: craftActions } = require('../store/craft');

// -----------------------------------------------------------------------------




// -----------------------------------------------------------------------------
const time = 30 * 1000;

const Progress = {
  MAIN_MENU: 0,
  MINION: 1
};

function Thread() {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    dialogId: 0,
    data: {}
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
        { type: 'type', requires: [ItemTypes.CHASSIS], displayName: 'Chassis' },
        { type: 'type', requires: [ItemTypes.CORE], displayName: 'Core' },
        { type: 'type', requires: [ItemTypes.SENSOR], displayName: 'Sensor' },
        { type: 'type', requires: [ItemTypes.DRIVETRAIN], displayName: 'Drivetrain' },
        { type: 'type', requires: [ItemTypes.TOOL], displayName: 'Tool' }
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
const getImage = ({ dialogId = 0 } = {}) => {
  return `${imageRoot}/nanoforge.jpg`;
};

const getMainMenuEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
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
        .setCustomId(`schematic-${schematic.uid}`)
        .setLabel(schematic.displayName)
        .setStyle('SECONDARY');
    });
    actionRow.addComponents(buttons);
    components.push(actionRow);
  }

  return { embeds: [embed], components };
};

const getMinionEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;

  // Grab the schematic.
  const schematic = inventory.find(item => item.uid === data.id);
  if (!schematic) {
    // ABORT.
    console.log('ABORT', thread);
    getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).delete();
    return { embeds: [], components: [], content: 'The Nanoforge has encountered a catastrophic error. Please try again.' };
  }

  console.log('-------------------');
  console.log(thread);
  console.log(inventory.length);
  console.log(data);
  console.log('schematic', !!schematic);
  console.log('-------------------');

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | CREATE MINION')
    .setImage(getImage(thread));

    // Now we go through the required items.
    let enabled = true;
    const partsRow = new MessageActionRow()
      .addComponents(
        schematic.data.parts.map(part => {
          console.log('=', part);
          const item = inventory.find(item => part.requires.includes(item.type));
          console.log('+', item?.displayName, item?.type);
          if (!item) enabled = false;
          return new MessageButton()
            .setCustomId(`craft-${item?.type}`)
            .setLabel(part.displayName)
            .setStyle('SECONDARY')
            .setDisabled(!item)
        })
      );

    const utilityRow = new MessageActionRow()
    .addComponents([
      new MessageButton()
        .setCustomId('forge')
        .setLabel('Forge')
        .setStyle('PRIMARY')
        .setDisabled(!enabled),

      new MessageButton()
        .setCustomId('back-to-main-menu')
        .setLabel('< Back')
        .setStyle('SECONDARY')
    ]);
  
    return { embeds: [embed], components: [utilityRow, partsRow] };
};

const getResponse = (userId) => {
  const { thread } = craftSelectors.select(store.getState())[userId];

  const embedFactory = {
    [Progress.MAIN_MENU]: getMainMenuEmbed,
    [Progress.MINION]: getMinionEmbed
  }[thread.dialogId];

  if (embedFactory) return embedFactory(userId);
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
  const response = getResponse(userId);
  interaction.editReply(response);

  // ------------------------------- HANDLERS ------------------------------------
  const filterButtons = i => i.user.id === userId;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Create new state.
    const { thread } = craftSelectors.select(store.getState())[userId];

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });

    switch (customId) {
      case 'minion': {
        break;
      }

      case 'back-to-main-menu': {
        const newThread = { ...thread, dialogId: Progress.MAIN_MENU, updated: new Date().getTime() };
        await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
        // await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        respond(interaction);
        break;
      }

      default: {
        if (customId.startsWith('schematic-')) {
          const [, schematicId] = customId.split('-');
          // TODO Gotta test this.
          const newThread = { ...thread, dialogId: Progress.MINION, data: { id: schematicId }, updated: new Date().getTime() };
          await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
          // await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
          respond(interaction);
          break;
        }
        // Save thread progress.
        // const newThread = { ...thread, dialogId: Progress.MINION, updated: new Date().getTime() };
        // await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        // respond(interaction, { ...newState, thread: newThread });
        // break;
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

        // Load the user data.
        await store.dispatch(craftActions.loadData({ userId: interaction.member.id }));

        // Respond.
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
