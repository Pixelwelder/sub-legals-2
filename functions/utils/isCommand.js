const { prefix } = require('../__config__/bot1.json');

module.exports = messageStr => messageStr.startsWith(prefix);
