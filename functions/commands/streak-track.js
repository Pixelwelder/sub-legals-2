const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');
const newStreak = require('../utils/newStreak');
const newAchievement = require('../utils/newAchievement');

module.exports = {
  name: 'streak:track',
  usage: 'streak:track <name of thing to track>',
  hide: false,
  description: 'Begin tracking a streak. Every day, you can update (or break) your streak.',
  aliases: ['track', 'st'],
  execute: async function (message, options, userParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { name, args } = getStreakArgs(message);
    const { userDoc, user, streaksByName } = await getStreaks(message);

    // Are we over the limit?
    const num = user.streaks.reduce((accum, { isHidden }) => isHidden ? accum : accum + 1, 0);
    if (num >= 5) {
      message.reply(`you've already got enough streaks. Please delete one first.`)
      return;
    }

    const currentStreak = streaksByName[name.toLowerCase()];

    if (currentStreak) {
      // The streak exists. Is it hidden?
      if (currentStreak.isHidden) {
        // It's hidden. Make it visible again.
        // TODO total++ if it's been more than a day.
        currentStreak.isHidden = false;
        currentStreak.checkIns.push(DateTime.now().toISO());
        await userDoc.ref.update(user);
        message.reply(`you've restored a streak: once again tracking "${name}".`)
        listStreaks(message, user);
        return;
      } else {
        // Nope. The user has made a mistake.
        message.reply(`you already have a streak called ${name}.`);
        listStreaks(message, user);
        return;
      }
    }

    // This is a new streak.
    message.reply(`you've started a new streak: now tracking "${name}".`)
    const streak = newStreak({
      displayName: name
    });

    // It's their first streak.
    if (!user.streaks.length) {
      if (!user.achievements) user.achievements = [];
      user.achievements.push(newAchievement({
        name: 'streaker',
        displayName: 'Streaker',
        description: 'Created a first streak.'
      }));
    }

    user.streaks.push(streak);
    await userDoc.ref.set(user);

    listStreaks(message, user);
  }
};
