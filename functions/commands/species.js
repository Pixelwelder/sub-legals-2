const admin = require('firebase-admin');
const Discord = require('discord.js');
const sendHelp = require('../utils/sendHelp');
const { path, getImage } = require('../utils/getImage');

module.exports = {
  name: 'species',
  usage: 'species <species name>',
  description: 'Asks the drone if it knows anything about a specific species. All species are from the [Galactic Registry](https://welcometo.network/).',
  execute: async function(message, options, userParams) {
    const split = message.content.split(' ');
    if (split.length < 2 || split[1].toLowerCase() === 'please') {
      sendHelp(message, this);
      return;
    }

    split.shift();
    const subject = split.join('-').toLowerCase();

    // message.react('🤔');

    const docs = await admin.firestore().collection('species')
      .where('name', '==', subject)
      .limit(1)
      .get();

    if (docs.size) {
      const species = docs.docs[0].data();
      let quirk = species.quirks[0].displayName;
      quirk = `${quirk.charAt(0).toLowerCase()}${quirk.slice(1)}`;
      const fullQuirk = `${species.displayName} ${quirk}.`

      const embed = new Discord.MessageEmbed()
        .setColor('0x000000')
        .setTitle(`Species: "${species.displayName}"`)
        .setDescription(`[${species.displayName}](https://welcometo.network/registry/${species.name}) are one of the 1.4M happy and productive species of the Network.`)

      const leaderDocs = await admin.firestore().collection('leaders').where('player', '==', species.player).get();
      if (leaderDocs.size) {
        const leader = leaderDocs.docs[0].data();
        let leaderStr = `${leader.title} ${leader.displayName}`;

        embed.addFields([
          { name: 'Leader', value: leaderStr }
        ]);
      }

      const playerDocs = await admin.firestore().collection('players').where('player', '==', species.player).get();
      if (playerDocs.size) {
        const player = playerDocs.docs[0].data();
        let contactStr = '';
        if (player.twitter) contactStr += `Twitter: @${player.twitter}`;
        if (player.instagram) contactStr = `${contactStr ? contactStr + ' | ' : '' }Instagram: @${player.instagram}`;
        if (!contactStr) contactStr = 'None provided.'
        embed.addFields({ name: 'Planetary Contact', value: contactStr });
      }

      embed.addFields({ name: 'Fun Fact', value: fullQuirk });

      const planetDocs = await admin.firestore().collection('inventory').where('displayName', '==', species.homeworld).get();
      if (planetDocs.size) {
        const planet = planetDocs.docs[0].data();
        const { image: { x1Url: url } } = planet;
        const fullUrl = await getImage(`${path}/${url}`);
        embed
          .setImage(fullUrl)
          .addFields([
            { name: 'Homeworld', value: `${species.homeworld} - ${planet.description}` }
          ]);
      }

      message.channel.send(embed);

      // message.reactions.cache.get('🤔').remove();
    } else {
      message.channel.send('🤷');
    }
  }
};
