const Filter = require('bad-words');
const filter = new Filter();
filter.removeWords('god', 'hell')

module.exports = (commandStr) => {
  return filter.isProfane(commandStr);
}
