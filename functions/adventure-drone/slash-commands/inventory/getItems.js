const store = require('../../store');
const { actions: inventoryActions, selectors: inventorySelectors, getSelectors } = require('../../store/inventory');
const Fuse = require('fuse.js');

/**
 * 
 * @param {*} param0 
 * @returns 
 */
const getItems = ({ userId, searchString }) => {
  // Assume items are current.
  const items = getSelectors(userId).selectInventory(store.getState());

  // Get the item.
  // The user may search by name or index.
  const number = parseInt(searchString);
  const result = [];
  if (isNaN(number)) {
    // it's a name.
    const fuse = new Fuse(items, { ignoreLocation: true, includeScore: true, threshold: 0.2, keys: ['displayName'] });
    result.push(...fuse.search(searchString).map(({ item }) => item));
  } else {
    // it's an index.
    const index = number - 1;
    if (items.length > index) result.push(items[index]);
  }

  return result;
};

module.exports = getItems;
