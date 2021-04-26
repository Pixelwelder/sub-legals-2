const admin = require('firebase-admin');
const newUser = require('../utils/newUser');

const getStreaks = async (message) => {
  const { id } = message.author;
  const userRef = admin.firestore().collection('discord_users').doc(id);
  const userDoc = await userRef.get();
  const user = userDoc.exists ? userDoc.data() : newUser();
  const streaksByName = {};
  user.streaks.forEach(streak => {
    streaksByName[streak.displayName.toLowerCase()] = streak;
  })

  return { userDoc, user, streaksByName };
};

module.exports = getStreaks;
