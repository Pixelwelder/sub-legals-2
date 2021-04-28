const { reply } = require('../__config__/bot1.json');

module.exports = (message) => {
  return reply ? message.channel.send : message.reply;
}
