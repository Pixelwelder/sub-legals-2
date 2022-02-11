const { getFirestore } = require('firebase-admin/firestore');
const { MessageEmbed, Permissions } = require('discord.js');
const { botToken, adminChannelId, adminGuildId } = require('../adventure-drone/settings');
const init = require('../adventure-drone/init');
const { getClient } = require('./nakedClient');
const {
  PLAYER_ROLE, ROLE_PREFIX, CATEGORY, START_CHANNEL, ENTRYWAY_CHANNEL
} = require('../adventure-drone/constants');
const rank = require('../utils/rank');
const reactions = require('../adventure-drone/reactions');
const settings = require('../utils/settings');
const channels = require('../utils/channels');
const newUser = require('../utils/newUser');
const { Character } = require('@pixelwelders/tlh-universe-data')

require('../utils/initFirebase');

const createCharacter = async ({ player }) => {
  const discordUser = await client.users.fetch(player);
  const avatarUrl = discordUser.avatarURL({ format: 'png', dynamic: true, size: 1024 });
  console.log('avatarUrl', avatarUrl);

  // const path = `${pathRoot}${uid}`;
  // const buffer = Buffer.from(png);
  // fs.writeFileSync(path, png);
  // 
  // await admin.storage().bucket().file(`avatars/${uid}`).save(buffer, {
  //   metadata: {
  //     fileType: 'image/png',
  //     metadata: {
  //       firebaseStorageDownloadTokens: uuid()
  //     }
  //   }
  // });

  const userDoc = await getFirestore().collection('discord_users').doc(player).get();
  const user = userDoc.data();
  const doc = getFirestore().collection('discord_characters').doc();
  const character = new Character({ uid: doc.id, displayName: user.displayName, player });
  await doc.set(character);
  console.log('character saved');
};

const client = getClient();
client.once('ready', () => {
  console.log('Ready!');


  // USKillbotics - 685513488411525164
  createCharacter({ player: '685513488411525164' });
});
client.login(botToken);
