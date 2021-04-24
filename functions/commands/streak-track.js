const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

const newStreak = (overrides) => {
  const nowStamp = DateTime.now().toISO();
  return {
    created: nowStamp,
    lastCheckIn: nowStamp,
    name: 'streak',
    displayName: 'Streak',
    description: 'Streak description',
    current: 1,
    longest: 1,
    total: 1,
    checkIns: [nowStamp],
    ...overrides
  };
};

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
        listStreaks(message, streaks);
        return;
      } else {
        // Nope. The user has made a mistake.
        message.reply(`You already have a streak called ${streakName}.`);
        listStreaks(message, streaks);
        return;
      }
    }

    // This is a new streak.
    message.reply(`New streak started: now tracking "${streakDisplayName}".`)
    const streak = newStreak({
      name: streakName,
      displayName: streakDisplayName
    });

    streaks.push(streak);
    await userDoc.ref.update({ ...user, streaks });

    listStreaks(message, streaks);
  }
};
