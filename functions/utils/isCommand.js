const { prefix } = require('../settings');

module.exports = messageStr => messageStr.startsWith(prefix);
