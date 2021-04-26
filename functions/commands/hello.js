const admin = require('firebase-admin');
const getIsProfane = require('../utils/getIsProfane');
const newUser = require('../utils/newUser');

module.exports = {
  name: 'hello',
  usage: 'hello',
  description: 'Says hello to this drone.',
  aliases: ['hi', 'gm', 'hey', 'morning', 'evening', 'afternoon', 'night', 'howdy', 'wassup', 'sup', 'yo', 'hullo'],
  execute: async (message) => {
    message.channel.send('👋');
    if (!getIsProfane(message.content)) {
      const { id } = message.author;
      const userRef = admin.firestore().collection('discord_users').doc(id);
      const userDoc = await userRef.get();
      const user = userDoc.exists ? userDoc.data() : newUser();
    }
  }
};
