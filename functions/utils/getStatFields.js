const { getBar } = require('./getBar');

const getStatFields = (stats, statChanges, { inline = false } = {}) => {
  const fields = stats.map((stat, index) => {
    let value = getBar(stat.value, stat.max);
    if (statChanges && statChanges[index]) {
      value = `${value} ${fullPoint.repeat(statChanges[index])}`;
    }

    return { name: stat.displayName, value, inline };
  });

  return fields;
};

module.exports = getStatFields;
