const admin = require('firebase-admin');
const { getClient } = require('../client');
const react = require('../../utils/react');
const getIsProfane = require('../../utils/getIsProfane');
const getPoliteness = require('../../utils/getPoliteness');
const newUser = require('../../utils/newUser');
const rank = require('../../utils/rank');

const onMessage = async (message, type) => {
  const client = getClient();
  console.log(`${message.author.username}: ${message.content}`);
  if (message.author.id === client.user.id) return;

  // Change opinion of user if necessary.
  const isProfane = getIsProfane(message.content);
  const politeness = getPoliteness(message.content);

  // React to specific mentions, e.g. "human".
  react(message, { isProfane });

  // Now record.
  // TODO Move.
  let user = newUser();
  const ref = admin.firestore().collection('discord_users').doc(message.author.id);
  const doc = await ref.get();
  if (doc.exists) {
    user = doc.data();
  }

  let delta = 0;
  if (politeness < 0) delta -= 1;
  if (politeness > 0) delta += 1;
  if (isProfane) delta -= 1;
  let newOpinion = user.opinion + delta;
  newOpinion = Math.max(0, newOpinion);
  newOpinion = Math.min(9, newOpinion);

  if (user.opinion !== newOpinion) {
    console.log(`opinion changed from ${user.opinion} to ${newOpinion} (${delta})`);
    await ref.set({
      ...user,
      opinion: newOpinion,
      displayName: message.author.username
    });
  }

  // Get user xp.
  if (type === 'message') {
    const { isNew, update } = await rank.update(message);

    try {
      if (isNew) {
        console.log('is new');
        // TODO I'm concerned that this might reset people under certain conditions.
        // What if isNew is true but they already have a user object? This is why merge: true.
        await admin.firestore().collection('discord_users').doc(update.id)
          .set(newUser({ ...update, displayName: message.author.username }), { merge: true });
      } else {
        await admin.firestore().collection('discord_users').doc(update.id)
          .update({ ...update, displayName: message.author.username });
      }
      console.log('Updated user', update.id);
    } catch (error) {
      console.error(error);
    }
  }
};

const init = () => {
  console.log('reactions.init');
  const client = getClient();
  client.on('messageCreate', async (message) => {
    await onMessage(message, 'message');
  });

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    await onMessage(newMessage, 'messageUpdate');
  });
};

module.exports = { init };
