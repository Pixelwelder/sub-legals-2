// const reply = require('../utils/getReplyFunction');

module.exports = {
  name: 'hello',
  usage: 'hello',
  description: 'Says hello to this drone.',
  execute: (message) => {
    message.channel.send('👋');
  }
};
