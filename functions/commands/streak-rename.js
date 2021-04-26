const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');
const sendHelp = require('../utils/sendHelp');
const admin = require('firebase-admin');

const separator = ', '

module.exports = {
  name: 'sr',
  usage: `streak:rename <streak name>${separator}<new name>`,
  hide: true,
  description: 'Rename a streak.',
  execute: async function (message, options, userParams) {
    const split = message.content.split(separator);
    if (split.length < 2) sendHelp(message, this);

    const oldName = split[0].split(' ').slice(1).join(' ');
    const newName = split[1].trim();
    console.log('renaming', oldName, newName);

    const { userDoc, user, streaksByName } = await getStreaks(message);

    const streak = streaksByName[oldName.toLowerCase()];
    if (!streak) {
      message.reply(`you don't have a streak named "${oldName}."`);
      listStreaks(message, user);
      return;
    }

    if (oldName === newName) {
      message.reply(`that streak is already named "${oldName}."`)
    }

    // Do the rename.
    streak.displayName = newName;
    await userDoc.ref.update(user);
    message.reply(`you have renamed "${oldName}" to "${newName}."`);
    listStreaks(message, user);

    // message.reply('These are your current streaks.');
    // listStreaks(message, user);
  }
};
