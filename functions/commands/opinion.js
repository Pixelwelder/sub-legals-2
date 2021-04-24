const admin = require('firebase-admin');

const emojis = [ // 0-9
  '😡', '😠', '☹️', '🙁', '😕', '😐', '🙂', '😊', '🥰', '😍'
];

module.exports = {
  name: 'opinion',
  usage: 'opinion <user tag (optional)>',
  description: 'Asks the drone for their opinion of a user. You can specify users by tagging them, or tag no one and the drone will tell you its opinion of _you_',
  execute: async (message, { politeness } = {}) => {
    const mentions = message.mentions.users.map(user => user);
    console.log('?', message.mentions.users.size);
    console.log('mentions:', message.mentions.users.size);
    const ids = message.mentions.users.map(({ id }) => id);
    if (!ids.length) ids.push(message.author.id);
    const users = await admin.firestore().runTransaction(async (transaction) => {
      const promises = ids.map((id) => {
        const ref = admin.firestore().collection('discord_users').doc(id);
        return transaction.get(ref);
      });

      const userDocs = await Promise.all(promises);
      const users = userDocs.map(user => {
        if (user.exists) {
          return user.data();
        } else {
          return { opinion: 5 };
        }
      });
      return users;
    });

    const msg = users.reduce((accum, user) => {
      const emoji = emojis[Math.floor(user.opinion)];

      return `${accum} ${emoji}`;
    }, '');

    // const doc = await admin.firestore().collection('discord_users').doc(message.author.id).get();
    // let opinion = 5;
    // if (doc.exists) {
    //   ({ opinion } = doc.data());
    // }
    //
    // if (politeness > 0) opinion += 1;
    // const emoji = emojis[Math.floor(opinion)];
    message.channel.send(msg);
  }
};
