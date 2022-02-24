const { getFirestore, increment } = require('firebase-admin/firestore');
// const isCommand = require('./isCommand');
const channels = require('./channels');
const xp = require('./xp');
const newUser = require('../utils/newUser');

const newRankUser = overrides => ({
  id: '',
  numMessages: 0,
  xp: 0,
  ...overrides
});

/**
 * For now, we keep the whole thing in memory.
 * In the future we'll need a better solution.
 */
let ranksDoc;  // The Firestore doc
let ranks;     // An array of rank objects.
let ranksById; // All rank objects keyed by user ID.
const initialize = async () => {
  const collection = getFirestore().collection('discord_meta');
  ranksDoc = await collection.doc('ranks').get();

  if (!ranksDoc.exists) {
    console.log('creating ranks doc');
    await collection.doc('ranks').set({ all: [] });
    ranksDoc = await collection.doc('ranks').get();
  }
  ranks = ranksDoc.data().all;
  ranksById = ranks.reduce((accum, rankObj) => ({ ...accum, [rankObj.id]: rankObj }), {});

  console.log('ranks initialized');
};

/**
 * When a user sends a message, we add a point.
 * TODO Add additional points for politeness.
 * TODO Should probably retrieve info from discord_users.
 * TODO Shouldn't store info on meta, but hey.
 * TODO Switch id to uid.
 */
const update = async (message, _xpToAdd) => {
  // Don't respond to commands.
  // if (isCommand(message.content)) return;

  // Don't respond to bots.
  if (message.author.bot) return;

  const { id } = message.author;
  const xpToAdd = _xpToAdd || message.content.length;
  let isNew = Boolean(!ranksById[id]);

  if (isNew) {
    const rankUser = newRankUser({ id });
    ranks.push(rankUser)
    ranksById[id] = rankUser;
  }
  const rankUser = ranksById[id];
  const oldXP = rankUser.xp;
  rankUser.numMessages ++;
  rankUser.xp += xpToAdd;
  ranks.sort((a, b) => {
    // Sort by xp, then numMessages, and then by ID.
    if (a.xp < b.xp) return 1;
    if (a.xp > b.xp) return -1;
    if (a.messages < b.messages) return 1;
    if (a.messages > b.messages) return -1;
    return a.id < b.id ? 1 : -1;
  });

  await ranksDoc.ref.update({ all: ranks });

  if (xp.toTier(rankUser.xp) > xp.toTier(oldXP) || isNew) {
    // const tag = message.member.user.tag.split('#')[0];
    // The user has leveled up. Add a point to their character's doc.
    // const characterDoc = await getFirestore().collection('discord_characters').doc(id).get();
    // const character = characterDoc.data();
    // if (character) {

    // }

    const tag = `<@${message.author.id}>`;
    let announcement = `${tag} has ascended to Tier ${xp.toTier(rankUser.xp)}.`;
    const num = Number(xp.toTier(rankUser.xp));
    if (num * 10 === Math.floor(num * 10)) {
      // On the tenths, add a new point the the character.
      announcement += ' You can use `/character examine` to apply a new point.';
      await getFirestore().collection('discord_characters').doc(id).update({
        statPoints: increment(1)
      });
    }

    const channel = channels.getBotChannel();
    if (channel) {
      channel.send(announcement);
    }
  }

  return {
    isNew,
    update: rankUser
  }
};

/**
 * Gets a user's rank.
 */
const getRank = async (id) => {
  const index = ranks.findIndex((rankUser) => rankUser.id === id);
  return {
    rank: index > -1 ? (index + 1) : (ranks.length + 1),
    total: index > -1 ? ranks.length : ranks.length + 1
  };
};

/**
 * Gets a user's rank plus surrounding ranks.
 */
const getRankInContext = (id, { numBefore = 2, numAfter = 2 } = {}) => {
  let index;
  const allRanks = [...ranks];
  const actualIndex = ranks.findIndex((rankUser) => rankUser.id === id);
  if (actualIndex === -1) {
     allRanks.push(newRankUser({ id }));
     index = allRanks.length - 1;
  } else {
    index = actualIndex;
  }
  let startIndex = Math.max(0, index - numBefore);
  let endIndex = Math.min(allRanks.length - 1, index + numAfter);
  const targetLength = numBefore + numAfter + 1;
  const actualLength = endIndex - startIndex + 1;
  if (actualLength < targetLength) {
    // We're at the beginning.
    console.log(startIndex, endIndex, actualLength, targetLength);
    if (startIndex === 0) endIndex = Math.min(allRanks.length - 1, endIndex + (targetLength - actualLength));
    // We're at the end
    if (endIndex === allRanks.length - 1) startIndex = Math.max(0, startIndex - (targetLength - actualLength))
    // There aren't enough users.
  }

  return {
    startRank: startIndex + 1,
    ranks: allRanks.slice(startIndex, endIndex + 1)
  }
};

/**
 * Gets all ranks.
 */
const getRanks = () => {};

module.exports = {
  initialize,
  update,

  getRank,
  getRankInContext,
  getRanks
};
