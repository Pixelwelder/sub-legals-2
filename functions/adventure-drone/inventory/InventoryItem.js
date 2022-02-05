/**
 * Create an inventory item.
 *
 * @param id - a unique id
 * @param displayName - the name of the item
 * @param description - a description of the item
 * @param meta - additional meta information
 */
function InventoryItem(id, displayName, description, meta) {
  this.id = id;
  this.displayName = displayName;
  this.description = description;
  this.meta = meta;
}

module.exports = InventoryItem;
