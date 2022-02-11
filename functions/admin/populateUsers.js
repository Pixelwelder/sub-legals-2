const admin = require('firebase-admin');
const { botToken, adminChannelId, adminGuildId } = require('../adventure-drone/settings');
const init = require('../adventure-drone/init');
const { getClient, fetchGuild } = require('../adventure-drone/client');
const {
  PLAYER_ROLE, ROLE_PREFIX, CATEGORY, START_CHANNEL, ENTRYWAY_CHANNEL
} = require('../adventure-drone/constants');
const rank = require('../utils/rank');
const reactions = require('../adventure-drone/reactions');
const settings = require('../utils/settings');
const channels = require('../utils/channels');
const newUser = require('../utils/newUser');

require('../utils/initFirebase');

const merge = async () => {
  const collection = admin.firestore().collection('discord_meta');
  ranksDoc = await collection.doc('ranks').get();
  const ranks = ranksDoc.data().all.map(({ id, ...rank }) => newUser({ ...rank, uid: id }));
  const ranksById = ranks.reduce((accum, rankObj) => ({ ...accum, [rankObj.uid]: rankObj }), {});

  // Now load the users from discord_users.
  const usersDocs = await admin.firestore().collection('discord_users').get();
  const users = usersDocs.docs.map(doc => newUser({ ...doc.data(), uid: doc.id }));
  const usersById = users.reduce((accum, userObj) => ({ ...accum, [userObj.uid]: userObj }), {});

  console.log('found', ranks.length, users.length);
  console.log(ranks[0], users[0]);

  // Now combine the two.
  // Generally speaking, we want the rank object. However, some users also have an opinion variable.
  await admin.firestore().runTransaction(async transaction => {
    const promises = ranks.map(rank => async () => {
      const { id, numMessages, xp } = rank;
      if (!usersById[id]) {

      }
    });
  });
  console.log('transaction complete');
};

const fixRanks = async () => {
  console.log('fixing ranks');
  const collection = admin.firestore().collection('discord_meta');
  ranksDoc = await collection.doc('ranks').get();
  const ranks = ranksDoc.data().all.map(({ id, ...rank }) => newUser({ ...rank, uid: id }));

  const usersDocs = await admin.firestore().collection('discord_users').get();
  const users = usersDocs.docs.map(doc => newUser({ ...doc.data(), uid: doc.id }));
  const usersById = users.reduce((accum, userObj) => ({ ...accum, [userObj.uid]: userObj }), {});

  console.log('found', ranks.length, users.length);

  await admin.firestore().runTransaction(async transaction => {
    const promises = ranks.map(async (rank) => {
      console.log('updating', rank);
      // const user = usersById[rank.uid];
      // if (user) {
      //   // We don't care about much.
      //   rank.opinion = user.opinion;
      // }
      const ref = admin.firestore().collection('discord_users').doc(rank.uid);
      await transaction.set(ref, rank);
    });
    console.log(promises.length);

    await Promise.all(promises);
  });
  console.log('done');
};

fixRanks();