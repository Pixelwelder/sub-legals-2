const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');
const newStreak = require('../utils/newStreak');
const newAchievement = require('../utils/newAchievement');

module.exports = {
  name: 's:t',
  usage: 'streak:track <name of thing to track>',
  hide: true,
  description: 'Tells the drone that you want to track a streak. Every day, you can update (or break) your streak.',
  execute: async function (message, options, userParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { userDoc, streaks, streaksByName, user } = await getStreaks(message);
    const { streakName, streakDisplayName } = getStreakArgs(message);
    const currentStreak = streaksByName[streakName];

    if (currentStreak) {
      console.log('currentStreak', currentStreak);
      // The streak exists. Is it hidden?
      if (currentStreak.isHidden) {
        // It's hidden. Make it visible again.
        // TODO Reset under certain conditions.
        currentStreak.isHidden = false;
        currentStreak.lastCheckIn = DateTime.now().toISO();
        await userDoc.ref.update(user);
        message.reply(`Streak restored: once again tracking "${streakDisplayName}".`)
        listStreaks(message, user, streaks);
        return;
      } else {
        // Nope. The user has made a mistake.
        message.reply(`You already have a streak called ${streakName}.`);
        listStreaks(message, user, streaks);
        return;
      }
    }

    // This is a new streak.
    message.reply(`New streak started: now tracking "${streakDisplayName}".`)
    const streak = newStreak({
      name: streakName,
      displayName: streakDisplayName
    });

    // It's their first streak.
    if (!streaks.length) {
      if (!user.achievements) user.achievements = [];
      user.achievements.push(newAchievement({
        name: 'streaker',
        displayName: 'Streaker',
        description: 'Created a first streak.'
      }));
    }

    streaks.push(streak);
    await userDoc.ref.update({ ...user, streaks });

    listStreaks(message, user, streaks);
  }
};
