const admin = require('firebase-admin');
const Discord = require('discord.js');

const path = 'images/inventory/real-estate/planet'
const getImage = async (url = `${path}/default-planet@1x.jpg`) => {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(url);
    const signedUrls = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    return signedUrls[0];
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  name: 'planet',
  usage: 'planet <planet name>',
  description: 'Asks the drone if it knows anything about the specified planet.',
  execute: async (message) => {
    const split = message.content.split(' ');
    if (split.length < 2) message.react('🤔');

    let subject = split[1].toLowerCase();
    subject = `${subject.charAt(0).toUpperCase()}${subject.slice(1)}`;

    const docs = await admin.firestore().collection('inventory')
      .where('displayName', '==', subject)
      .limit(1)
      .get();

    if (docs.size) {
      const data = docs.docs[0].data();
      const { image: { x1Url: url } } = data;
      const fullUrl = await getImage(`${path}/${url}`);
      console.log('fullUrl', fullUrl);
      const embed = new Discord.MessageEmbed()
        .setColor('0x000000')
        .setTitle(`Planet ${data.displayName}`)
        .setDescription(data.description)
        .setImage(fullUrl);
      message.channel.send(embed);
    } else {
      message.react('❌');
    }
  }
};
