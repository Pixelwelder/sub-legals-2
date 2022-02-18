const { PersonalInventoryItem } = require('@pixelwelders/tlh-universe-data');
const ItemTypes = require('./ItemTypes');

// Used to craft an item.
function Schematic(overrides) {
  return new PersonalInventoryItem({
    type: ItemTypes.SCHEMATIC,
    displayName: 'Schematic',
    data: {
      outputType: '',
      outputImage: ''
    },
    ...overrides
  });
}

module.exports = Schematic;
