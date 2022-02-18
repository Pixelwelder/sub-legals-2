const { MessageActionRow, MessageButton } = require('discord.js');
const getSummaryString = require('../adventure-drone/slash-commands-experimental/forge/getSummaryString');
const wrapArray = require('./wrapArray');

/**
 * Takes an array of items and returns a two-dimensional array of buttons.
 * Adds prev/next buttons if necessary.
 *
 * @param {*} items - the items to turn into a grid
 * @param {*} backId - the id of the button to go back in the thread
 * @param {*} selectedUid - the id of the currently selected item in this collection
 * @returns 
 */
const getButtonGrid = ({ items, backId, page, name, selectedUid }) => {
  const buttonRows = [];

  // We might have more items than we can show. Therefore we paginate.
  // Since we can show 25 buttons, we will reserve one row of 5 for controls, leaving us 20.
  const pageSize = 20;
  const pageCount = Math.ceil(items.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const displayedItems = items.slice(startIndex, endIndex);

  // Create the buttons.
  if (displayedItems.length) {
    // Now wrap the array.
    const items2D = wrapArray(displayedItems, 5);
    // Create buttons.
    items2D.forEach((row) => {
      const actionRow = new MessageActionRow();
      const buttons = row.map(item => {
        let label = item.displayName;
        if (item?.data?.statModifiers) {
          const summary = getSummaryString(item.data.statModifiers);
          label = `${label} ${summary}`;
        }
        return new MessageButton()
          .setCustomId(`${name}-${item.uid}`)
          .setLabel(label)
          .setStyle(selectedUid && item.uid === selectedUid ? 'SUCCESS' : 'SECONDARY');
      });
      actionRow.addComponents(buttons);
      buttonRows.push(actionRow);
    });
  }

  // Add a back button if requested.
  const controlRowButtons = [];
  if (backId) {
    controlRowButtons.push(
      new MessageButton()
        .setCustomId(backId)
        .setLabel('< Back')
        .setStyle('SECONDARY')
    );
  }

  // Now add pagination buttons.
  if (pageCount > 1) {
    controlRowButtons.push(
      new MessageButton()
        .setCustomId(`page-${name}-${page - 1}`)
        .setLabel(`< Page ${page}`)
        .setStyle('SECONDARY')
        .setDisabled(page === 0),
      new MessageButton()
        .setCustomId(`page-${name}-${page + 1}`)
        .setLabel(`Page ${page + 2} >`)
        .setStyle('SECONDARY')
        .setDisabled(page === pageCount - 1)
    );
  }

  // If control row has buttons, add it.
  if (controlRowButtons.length) {
    const controlRow = new MessageActionRow().addComponents(controlRowButtons);
    buttonRows.push(controlRow);
  }

  return buttonRows;
};

module.exports = getButtonGrid;
