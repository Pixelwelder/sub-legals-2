const sendHelp = require('../utils/sendHelp');

module.exports = {
  name: 'hug',
  usage: 'hug <user>',
  hide: false,
  description: 'Give another user a hug.',
  aliases: [],
  execute: async function (message, options, userParams) {
    const ids = message.mentions.users.map(({ id }) => id);
    if (!ids.length) {
      sendHelp(message, this);
      return;
    }

    // Only hug the first one.
    const id = ids[0];
    if (message.client.user.id === id) {
      message.react('❌');
      return;
    }

    message.channel.send(`_enfolds <@${id}> in a mechanical embrace (at <@${message.author.id}>'s request)_`);
  }
};
