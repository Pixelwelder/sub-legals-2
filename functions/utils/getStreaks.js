const admin = require('firebase-admin');
const newUser = require('../utils/newUser');
const fetchUser = require('../utils/fetchUser');

const getStreaks = async (message) => {
  const { id } = message.author;
  const { userDoc, user } = await fetchUser(id);

  const streaksByName = user.streaks
    .reduce((accum, streak) => ({
      ...accum, [streak.displayName.toLowerCase()]: streak
    }), {});

  // user.streaks.forEach(streak => {
  //   streaksByName[streak.displayName.toLowerCase()] = streak;
  // });

  return { userDoc, user, streaksByName };
};

module.exports = getStreaks;
