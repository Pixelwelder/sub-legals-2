const Schematic = require('./Schematic');
const ItemTypes = require('./ItemTypes');

function DroneSchematic(overrides) {
  return new Schematic({
    displayName: 'Generic Drone',
    data: {
      parts: [
        { requires: 'type', options: [ItemTypes.CHASSIS], displayName: 'Chassis' },
        { requires: 'type', options: [ItemTypes.CORE], displayName: 'Core' },
        { requires: 'type', options: [ItemTypes.SENSOR], displayName: 'Sensor' },
        { requires: 'type', options: [ItemTypes.DRIVETRAIN], displayName: 'Drivetrain' },
        { requires: 'type', options: [ItemTypes.TOOL, ItemTypes.WEAPON], displayName: 'Equipment' }
      ],
      output: {
        type: ItemTypes.MINION,
        image: 'parts_44.png',
        displayName: 'Gerald',
        description: 'A bubbly, personable little drone.'
      }
    },
    ...overrides
  });
}

module.exports = DroneSchematic;
