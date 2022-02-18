const { getFirestore } = require('firebase-admin/firestore');
const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const ItemTypes = require('../../data/ItemTypes');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const DroneSchematic = require('../../data/DroneSchematic');

const createParts = async (interaction, { adminId = '685513488411525164' } = {}) => {
  // Create a bunch of parts in firestore and give them all to USKillbotics (685513488411525164).
  [ItemTypes.CHASSIS, ItemTypes.CORE, ItemTypes.SENSOR, ItemTypes.DRIVETRAIN, ItemTypes.TOOL, ItemTypes.WEAPON]
    .forEach(async type => {
      const doc = getFirestore().collection('discord_inventory').doc();
      const item = new PersonalInventoryItem({
        uid: doc.id,
        player: adminId,
        type,
        displayName: `${capitalize(type)} ${Math.floor(Math.random() * 100)}`,
        description: 'Looks pretty beat up.',
        image: `parts_${Math.floor(Math.random() * 45)}.png`
      });
      await doc.set(item);
    });

  // Create schematic.
  const doc = getFirestore().collection('discord_inventory').doc();
  const item = new DroneSchematic({
    displayName: `Generic Drone ${Math.floor(Math.random() * 100)}`,
    uid: doc.id,
    player: adminId,
    image: `parts_12.png`
  });
  console.log('ITEM', item);
  await doc.set(item);
  interaction.editReply('Test items created.');
};

module.exports = createParts;
