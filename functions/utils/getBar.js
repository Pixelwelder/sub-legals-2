const fullSquare = '🟥';
const emptySquare = '⬛';
const fullPoint = '🔴';
const emptyPoint = '⚫';

// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (num, max, full = fullSquare, empty = emptySquare) => {
  return `${full.repeat(num)}${empty.repeat(max - num)}`;
};

module.exports = {
  getBar,
  fullSquare,
  emptySquare,
  fullPoint,
  emptyPoint
};
