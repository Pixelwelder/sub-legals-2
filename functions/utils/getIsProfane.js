const Filter = require('bad-words');
const filter = new Filter();

module.exports = (commandStr) => filter.isProfane(commandStr);
