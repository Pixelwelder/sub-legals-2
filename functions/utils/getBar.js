const fullSquare = '🟥';
const emptySquare = '⬛';
const fullPoint = '🔴';
const emptyPoint = '⚫';

// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (num = 0, max = 0, full = fullSquare, empty = emptySquare) => {
  try {
    return `${full.repeat(num)}${empty.repeat(max - num)}`;
  } catch (error) {
    console.error('getBar', error, num, max);
  }
};

module.exports = {
  getBar,
  fullSquare,
  emptySquare,
  fullPoint,
  emptyPoint
};
