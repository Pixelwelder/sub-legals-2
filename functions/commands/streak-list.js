const getStreaks = require('../utils/getStreaks');
const listStreaks = require('../utils/listStreaks');

module.exports = {
  name: 'streak:list',
  usage: 'streak:list',
  hide: false,
  description: 'List all your current streaks.',
  aliases: ['list', 'sl'],
  execute: async function (message, options, userParams, yargParams) {
    const { user } = await getStreaks(message);

    message.reply('these are your current streaks.');
    listStreaks(message, user, yargParams);
  }
};
