const admin = require('firebase-admin');

module.exports = async (message) => {
  const split = message.content.split(' ');
  if (split.length < 2) message.react('🤔');

  let subject = split[1].toLowerCase();
  subject = `${subject.charAt(0).toUpperCase()}${subject.slice(1)}`;

  console.log(subject);
  const docs = await admin.firestore().collection('inventory')
    .where('displayName', '==', subject)
    .limit(1)
    .get();

  if (docs.size) {
    const data = docs.docs[0].data();
    message.channel.send(`"${data.displayName}: ${data.description}"`);
  } else {
    message.react('❌');
  }
};
