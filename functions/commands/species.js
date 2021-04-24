const admin = require('firebase-admin');

module.exports = {
  name: 'species',
  usage: 'species <species name>',
  description: 'Asks the drone if it knows anything about the specified planet.',
  execute: async (message) => {
    const split = message.content.split(' ');
    if (split.length < 2) message.react('🤔');

    split.shift();
    const subject = split.join('-').toLowerCase();
    console.log(subject);

    const docs = await admin.firestore().collection('species')
      .where('name', '==', subject)
      .limit(1)
      .get();

    if (docs.size) {
      const data = docs.docs[0].data();
      let quirk = data.quirks[0].displayName;
      quirk = `${quirk.charAt(0).toLowerCase()}${quirk.slice(1)}`;
      message.channel.send(`"${data.displayName} ${quirk}."`);
    } else {
      message.react('❌');
    }
  }
};
