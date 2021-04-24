const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 's:l',
  usage: 'streak:list',
  hide: true,
  description: 'Tells the drone that you want to list all your current streaks.',
  execute: async function (message, options, userParams) {
    const { userDoc, streaks, streaksByName, user } = await getStreaks(message);

    message.reply('These are your current streaks.');
    listStreaks(message, user, streaks);
  }
};
