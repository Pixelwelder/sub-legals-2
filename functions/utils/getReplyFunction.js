const { reply } = require('../__config__/discord.json');

module.exports = (message) => {
  return reply ? message.channel.send : message.reply;
}
