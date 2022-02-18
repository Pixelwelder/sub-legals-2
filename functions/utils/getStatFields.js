const { getBar, fullSquare, pendingSquare, emptySquare } = require('./getBar');

const getStatFields = (stats, statChanges = [0, 0, 0, 0, 0, 0, 0], { inline = false } = {}) => {
  const fields = stats.map((stat, index) => {
    // let value = getBar(stat.value, stat.max);

    const full = fullSquare.repeat(stat.value);
    const numPending = statChanges[index];
    const pending = pendingSquare.repeat(numPending);
    const empty = emptySquare.repeat(stat.max - stat.value - numPending);
    const value = `${full}${pending}${empty}`;

    return { name: stat.displayName, value, inline };
  });

  return fields;
};

module.exports = getStatFields;
