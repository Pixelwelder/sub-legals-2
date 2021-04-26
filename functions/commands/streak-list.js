const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 'sl',
  usage: 'streak:list',
  hide: true,
  description: 'List all your current streaks.',
  execute: async function (message, options, userParams, yargParams) {
    const { user } = await getStreaks(message);

    message.reply('these are your current streaks.');
    listStreaks(message, user, yargParams);
  }
};
