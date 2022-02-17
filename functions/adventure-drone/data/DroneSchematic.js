const Schematic = require('./Schematic');

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
      ]
    },
    ...overrides
  });
}

module.exports = DroneSchematic;
