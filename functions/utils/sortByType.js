// Sorts an array into a map of arrays by type.
const sortByType = (items) => {
  const itemsByType = {};
  items.forEach(item => {
    if (!itemsByType[item.type]) itemsByType[item.type] = [];
    itemsByType[item.type].push(item);
  });

  return itemsByType;
};

module.exports = sortByType;;
