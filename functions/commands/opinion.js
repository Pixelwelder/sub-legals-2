const admin = require('firebase-admin');
const newUser = require('../utils/newUser');

const emojis = [ // 0-9
  '😡', '😠', '☹️', '🙁', '😕', '😐', '🙂', '😊', '🥰', '😍'
];

module.exports = {
  name: 'opinion',
  usage: 'opinion <user tag (optional)>',
  description: 'Asks the drone for their opinion of a user. You can specify users by tagging them, or tag no one and the drone will tell you its opinion of _you_',
  execute: async (message, { politeness } = {}) => {
    const mentions = message.mentions.users.map(user => user);
    const ids = message.mentions.users.map(({ id }) => id);
    if (!ids.length) ids.push(message.author.id);
    const users = await admin.firestore().runTransaction(async (transaction) => {
      const promises = ids.map((id) => {
        const ref = admin.firestore().collection('discord_users').doc(id);
        return transaction.get(ref);
      });

      const userDocs = await Promise.all(promises);
      return userDocs.map(user => {
        return user.exists ? user.data() : newUser();
      });
    });

    const msg = users.reduce((accum, user) => {
      const emoji = emojis[Math.floor(user.opinion)];

      return `${accum} ${emoji}`;
    }, '');

    message.channel.send(msg);
  }
};
