const admin = require('firebase-admin');
const newUser = require('../utils/newUser')
const fixUser = require('../utils/fixUser');
const getOpinionImage = require('../utils/getOpinionImage');

module.exports = {
  name: 'opinion',
  usage: 'opinion <user tag (optional)>',
  description: 'Asks the drone for their opinion of a user. You can specify users by tagging them, or tag no one and the drone will tell you its opinion of _you_',
  execute: async (message, { politeness } = {}) => {
    const ids = message.mentions.users.map(({ id }) => id);
    if (!ids.length) ids.push(message.author.id);
    const users = await admin.firestore().runTransaction(async (transaction) => {
      const promises = ids.map((id) => {
        const ref = admin.firestore().collection('discord_users').doc(id);
        return transaction.get(ref);
      });

      const userDocs = await Promise.all(promises);
      return userDocs.map(user => {
        const userObj = user.exists ? user.data() : newUser();
        fixUser(userObj);
        return userObj;
      });
    });

    const msg = users.reduce((accum, user) => {
      const emoji = getOpinionImage(user.opinion + (politeness > 0 ? 1 : 0));

      return `${accum} ${emoji}`;
    }, '');

    message.channel.send(msg);
  }
};
