const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getClient } = require('../client');
const wrapArray = require('../../utils/wrapArray');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const store = require('../store');
const { selectors: craftSelectors, actions: craftActions } = require('../store/craft');
const DialogIds = require('../data/DialogIds');
// -----------------------------------------------------------------------------




// -----------------------------------------------------------------------------
const time = 30 * 1000;

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
const pluralize = (word) => word.endsWith('s') ? `${word}es` : `${word}s`;

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

const getAbort = (userId) => {
  getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).delete();
  return { embeds: [], components: [], content: 'The Nanoforge has encountered a catastrophic error. Please try again.' };
};

const getMainMenuEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | ONLINE')
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

  // Add description.
  embed.setDescription(`What would you like to craft? You have ${schematics.length} schematic${schematics.length === 1 ? '' : 's'}.`);
  // const fields = schematics.map(schematic => ({ name: schematic.displayName, value: schematic.description || 'No description.' }));
  // embed.addFields(fields);

  return { embeds: [embed], components };
};

const getMinionEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;

  // Grab the schematic.
  const schematic = inventory.find(item => item.uid === data.itemUid);
  if (!schematic) return getAbort(userId);

  // console.log('-------------------');
  // console.log(thread);
  // console.log(inventory.length);
  // console.log(data);
  // console.log('schematic', !!schematic);
  // console.log('-------------------');

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
        .setCustomId(`goto-${DialogIds.MAIN_MENU}`)
        .setLabel('< Back')
        .setStyle('SECONDARY'),

        new MessageButton()
        .setCustomId('forge')
        .setLabel('Forge')
        .setStyle('PRIMARY')
        .setDisabled(!enabled)
    ]);
  
    return { embeds: [embed], components: [utilityRow, partsRow] };
};

const getListEmbed = (userId) => {
  const { thread, inventory } = craftSelectors.select(store.getState())[userId];
  const { data } = thread;
  const { type } = data;

  if (!type) return getAbort(userId);
  
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`NANOFORGE | ${capitalize(pluralize(type))}`);

  // Grab the items in this category. Each one gets a button.
  // const parts = inventory.filter(item => item.type === type);
  // if (parts.length) {
  //   const actionRow = new MessageActionRow();
  //   const buttons = parts.map(part => {
  //     return new MessageButton()
  //       .setCustomId(`craft-${part.uid}`)
  //       .setLabel(part.displayName)
  //       .setStyle('SECONDARY');
  //   });
  //   actionRow.addComponents(buttons);
  //   return { embeds: [embed], components: [actionRow] };
  // }
  // const partsRow = new MessageActionRow()
  //   .addComponents(

  //     schematic.data.parts.map(part => {
  //       console.log('=', part);
  //       const item = inventory.find(item => part.requires.includes(item.type));
  //       console.log('+', item?.displayName, item?.type);
  //       return new MessageButton()
  //         .setCustomId(`craft-${item?.type}`)
  //         .setLabel(part.displayName)
  //         .setStyle('SECONDARY')
  //         .setDisabled(!item)
  //     })
  //   );

  const utilityRow = new MessageActionRow()
    .addComponents([
      new MessageButton()
        .setCustomId(`goto-${DialogIds.MAIN_MENU}`)
        .setLabel('< Back')
        .setStyle('SECONDARY'),

        new MessageButton()
        .setCustomId('forge')
        .setLabel('Forge')
        .setStyle('PRIMARY')
        .setDisabled(true)
    ]);
  
  return { embeds: [embed], components: [utilityRow, partsRow] };
};

const getResponse = (userId) => {
  const { thread } = craftSelectors.select(store.getState())[userId];

  const embedFactory = {
    [DialogIds.MAIN_MENU]: getMainMenuEmbed,
    [DialogIds.MINION]: getMinionEmbed
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
    
    if (customId.startsWith('goto-')) {
      const [, dialogId] = customId.split('-');
      const newThread = { ...thread, dialogId, updated: new Date().getTime() };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      respond(interaction);

    } else if (customId.startsWith('schematic-')) {
      const [, schematicId] = customId.split('-');
      // TODO Gotta test this.
      const newThread = { ...thread, dialogId: DialogIds.MINION, data: { itemUid: schematicId }, updated: new Date().getTime() };
      await store.dispatch(craftActions.saveData({ userId, data: { thread: newThread } }));
      respond(interaction);
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
