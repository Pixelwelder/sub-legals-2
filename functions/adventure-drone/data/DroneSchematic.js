const { nameByRace } = require('fantasy-name-generator');
const Schematic = require('./Schematic');
const ItemTypes = require('./ItemTypes');

const races = [
  'angel', 'caveperson', 'darkelf', 'demon', 'dragon', 'drow', 'dwarf', 'elf', 'fairy', 'gnome', 'goblin', 'halfdemon',
  'halfling', 'highelf', 'highfairy', 'ogre', 'orc'
];

function DroneSchematic(overrides) {
  return new Schematic({
    displayName: 'Generic Drone',
    description: 'A drone schematic.',
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
        displayName: nameByRace(races[Math.floor(Math.random() * races.length)], { gender: Math.random() < 0.5 ? 'male' : 'female' }),
        description: 'A bubbly, personable little drone.'
      }
    },
    ...overrides
  });
}

module.exports = DroneSchematic;
