const fullSquare = '🟥';
const emptySquare = '⬛';
const pendingSquare = '🟦';
const fullPoint = '🔴';
const emptyPoint = '⚫';

// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (_num = 0, _max = 0, full = fullSquare, empty = emptySquare) => {
  const num = Math.max(_num, 0);
  const max = Math.max(_max, 0);
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
  pendingSquare,
  fullPoint,
  emptyPoint
};
