const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');
const getRemainingTime = require('../utils/getRemainingTime');
const sendHelp = require('../utils/sendHelp');

module.exports = {
  name: 's:c',
  usage: 'streak:check-in <name of streak>',
  hide: true,
  description: 'Tells the drone that you want to check in on a streak for today.',
  execute: async function (message, options, userParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { userDoc, streaks, streaksByName, user } = await getStreaks(message);
    const { streakName, streakDisplayName } = getStreakArgs(message);
    const toCheckIn = streaksByName[streakName];

    if (!toCheckIn) {
      message.reply(`You don't have a streak called "${streakName}".`);
      listStreaks(message, user, streaks);
      return;
    }

    if (toCheckIn) {
      const now = DateTime.now();
      const nowStamp = now.toISO();
      const lastCheckInStamp = toCheckIn.checkIns[toCheckIn.checkIns.length - 1];
      const remaining = getRemainingTime(lastCheckInStamp);

      if (remaining.hours < 0) {
        // Oops.
        toCheckIn.current = 1;
      } else {
        // We're good.
        const lastCheckIn = DateTime.fromISO(lastCheckInStamp);
        if (now.day !== lastCheckIn.day) {
          // It's a new day.
          toCheckIn.current ++;
          if (toCheckIn.current > toCheckIn.longest) toCheckIn.longest = toCheckIn.current;
        }
      }

      toCheckIn.checkIns.push(nowStamp);

      await userDoc.ref.update(user);
      listStreaks(message, user, streaks);

      // const diff = new admin.firestore.Timestamp().compareTo(toCheckIn.lastCheckIn);
      // console.log('diff', diff);
    }
  }
};
