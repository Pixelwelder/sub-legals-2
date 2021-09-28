const { SlashCommandBuilder } = require('@discordjs/builders');
const getIsProfane = require('../utils/getIsProfane');
const fetchUser = require('../utils/fetchUser');

module.exports = {
  name: 'hello',
  usage: 'hello',
  description: 'Say hello to this drone.',
  aliases: [
    'hi', 'gm', 'hey', 'morning', 'evening', 'afternoon', 'night', 'howdy', 'wassup', 'sup', 'yo', 'hullo', 'greetings',
    'goodbye'
  ],
  execute: async function(message) {
    message.channel.send('👋');
    if (!getIsProfane(message.content)) {
      const { id } = message.author;
      const { user, userDoc } = await fetchUser(id);
      await userDoc.ref.set({ ...user, opinion: user.opinion + 1 });
    }
  }
};
