const getReplyFunc = require('../utils/getReplyFunction');

module.exports = (message, { politeness = 0 } = {}) => {
  console.log('politeness', politeness);

  if (politeness < -0.5) {
    message.reply(':(');
  } else {
    message.reply(message.guild.memberCount.toString());
  }

  // getReplyFunc(message)(replyStr)

  // getReplyFunc(message)(replyStr);
};
