const admin = require('firebase-admin');

const getStreaks = async (message) => {
  const { id } = message.author;
  const userRef = admin.firestore().collection('discord_users').doc(id);
  const userDoc = await userRef.get();
  const streaks = [];
  const streaksByName = {};
  let user = { opinion: 5, streaks: [] };
  // TODO Review references here.
  if (userDoc) {
    user = userDoc.data();

    streaks.push(...(user.streaks || []));
    streaks.forEach(streak => {
      streaksByName[streak.name] = streak;
    })
  }

  return { userDoc, streaks, streaksByName, user };
};

module.exports = getStreaks;
