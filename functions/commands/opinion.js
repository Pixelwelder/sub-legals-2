const admin = require('firebase-admin');

const emojis = [ // 0-9
  '😡', '😠', '☹️', '🙁', '😕', '😐', '🙂', '😊', '🥰', '😍'
];

module.exports = async (message, { politeness } = {}) => {
  const doc = await admin.firestore().collection('discord_users').doc(message.author.id).get();
  let opinion = 5;
  if (doc.exists) {
    ({ opinion } = doc.data());
  }

  // if (politeness > 0) opinion += 1;
  const emoji = emojis[Math.floor(opinion)];
  message.channel.send(emoji);
};
