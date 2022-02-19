const store = require('../../store');
const { actions: inventoryActions, selectors: inventorySelectors, getSelectors } = require('../../store/inventory');
const Fuse = require('fuse.js');

const getItem = async ({ userId, searchString }) => {
  // Refresh this user's items.
  await store.dispatch(inventoryActions.loadData({ userId }));
  const items = getSelectors(userId).selectInventory(store.getState());

  // Get the item.
  // The user may search by name or index.
  const number = parseInt(searchString);
  const result = [];
  if (isNaN(number)) {
    // it's a name.
    const fuse = new Fuse(items, { ignoreLocation: true, includeScore: true, threshold: 0.2, keys: ['displayName'] });
    result.push(...fuse.search(searchString));
  } else {
    // it's an index.
    const index = number - 1;
    if (items.length > index) result.push({ item: items[index] });
  }

  if (result.length === 0) {
    interaction.editReply(`You don't have an item called "${searchString}".`);
    return null;
  } else if (result.length > 1) {
    interaction.editReply(
      `Can you be more specific or use a number? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    );
    return null;
  }

  return result[0].item;
};

module.exports = getItem;
