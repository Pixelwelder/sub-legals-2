const admin = require('firebase-admin');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 's:d',
  usage: 'streak:delete <name of streak to delete>',
  hide: true,
  description: 'Tells the drone that you want to delete a streak.',
  execute: async function (message, options, userParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { streakName, streakDisplayName } = getStreakArgs(message);
    const { userDoc, streaks, streaksByName, user } = await getStreaks(message);
    const toDelete = streaksByName[streakName];

    console.log('toDelete', toDelete);

    if (!toDelete) {
      message.reply(`You don't have a streak called "${streakName}".`);
      listStreaks(message, user, streaks);
      return;
    }

    toDelete.isHidden = true;
    await userDoc.ref.update(user);

    message.reply(`Streak "${streakDisplayName}" has been deleted. You can track it again to restore it.`);
    listStreaks(message, user, streaks);
  }
}
