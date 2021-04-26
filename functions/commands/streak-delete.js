const admin = require('firebase-admin');
const sendHelp = require('../utils/sendHelp');
const getStreakArgs = require('../utils/getStreakArgs');
const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 'streak:delete',
  usage: 'streak:delete <name of streak to delete>',
  hide: false,
  description: 'Delete a streak.',
  aliases: ['delete', 'sd'],
  execute: async function (message, options, userParams, yargParams) {
    if (!userParams.length){
      sendHelp(message, this);
      return;
    }

    const { name } = getStreakArgs(message);
    const { userDoc, user, streaksByName } = await getStreaks(message);
    const toDelete = streaksByName[name.toLowerCase()];

    if (!toDelete) {
      message.reply(`you don't have a streak called "${name}".`);
      listStreaks(message, user);
      return;
    }


    let reply = `streak "${name}" has been deleted.`;
    if (toDelete.isHidden) {
      const { forever } = yargParams;
      if (forever) {
        user.streaks = user.streaks.filter(streak => streak.displayName !== name);
      } else {
        message.reply(`Your streak "${name}" has already been deleted.`);
        return;
      }
    } else {
      reply += ' You can track it again to restore it.';
      toDelete.isHidden = true;
    }

    await userDoc.ref.update(user);

    message.reply(reply);
    listStreaks(message, user);
  }
}
