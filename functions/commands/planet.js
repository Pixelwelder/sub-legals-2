const admin = require('firebase-admin');
const Discord = require('discord.js');
const { getImage, path } = require('../utils/getImage');
const sendHelp = require('../utils/sendHelp');

module.exports = {
  name: 'planet',
  usage: 'planet <planet name>',
  description: 'Asks the drone if it knows anything about a specific planet.',
  execute: async function(message, options, userParams = {}) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    let subject = userParams[0];
    subject = `${subject.charAt(0).toUpperCase()}${subject.slice(1)}`;

    const docs = await admin.firestore().collection('inventory')
      .where('displayName', '==', subject)
      .limit(1)
      .get();

    if (docs.size) {
      const data = docs.docs[0].data();
      const { image: { x1Url: url } } = data;
      const fullUrl = await getImage(`${path}/${url}`);
      const embed = new Discord.MessageEmbed()
        .setColor('0x000000')
        .setTitle(`Planet ${data.displayName}`)
        .setDescription(data.description)
        .setImage(fullUrl);
      message.channel.send(embed);
    } else {
      message.channel.send('🤷');
    }
  }
};
