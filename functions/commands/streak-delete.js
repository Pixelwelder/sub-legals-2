const admin = require('firebase-admin');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 'sd',
  usage: 'streak:delete <name of streak to delete>',
  hide: true,
  description: 'Delete a streak.',
  execute: async function (message, options, userParams, yargParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { name, args } = getStreakArgs(message);
    const { userDoc, streaks, streaksByName, user } = await getStreaks(message);
    const toDelete = streaksByName[name.toLowerCase()];

    if (!toDelete) {
      message.reply(`you don't have a streak called "${name}".`);
      listStreaks(message, user, streaks);
      return;
    }

    if (toDelete.isHidden) {
      const { forever } = yargParams;
      if (forever) {
        user.streaks = user.streaks.filter(streak => streak.displayName !== name);
      } else {
        message.reply(`Your streak "${name}" has already been deleted.`);
        return;
      }
    } else {
      toDelete.isHidden = true;
    }

    await userDoc.ref.update(user);

    message.reply(`streak "${name}" has been deleted. You can track it again to restore it.`);
    listStreaks(message, user, streaks);
  }
}
