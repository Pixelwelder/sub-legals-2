const sendHelp = require('../utils/sendHelp');
const channels = require('../utils/channels');

module.exports = {
  name: 'sayy',
  usage: 'sayy <phrase>',
  hide: true,
  aliases: [],
  description: 'Say something.',
  execute: async function (message, options, userParams, yargParams) {
    if (!userParams.length) sendHelp(message, this);

    const split = message.content.split(' ');
    split.shift();

    const channel = channels.getBotChannel();
    channel.send(split.join(' '));
  }
};
