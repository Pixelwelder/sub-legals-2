// const reply = require('../utils/getReplyFunction');

module.exports = {
  name: 'invalid',
  usage: 'invalid',
  description: 'Executed when no valid command can be found.',
  execute: (message) => {
    message.react('🤔');
  }
};
