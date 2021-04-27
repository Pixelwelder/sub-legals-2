const admin = require('firebase-admin');
const getIsProfane = require('../utils/getIsProfane');
const newUser = require('../utils/newUser');

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
      const userRef = admin.firestore().collection('discord_users').doc(id);
      const userDoc = await userRef.get();
      const user = userDoc.exists ? userDoc.data() : newUser();
      await userRef.set({ ...user, opinion: user.opinion + 1 });
    }
  }
};
