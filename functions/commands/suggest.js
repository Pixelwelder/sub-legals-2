const admin = require('firebase-admin');
const getIsProfane = require('../utils/getIsProfane');
const newUser = require('../utils/newUser');
const sendHelp = require('../utils/sendHelp');

const { google } = require('googleapis');

module.exports = {
  name: 'a',
  usage: 'suggest <name>',
  description: 'Suggests a work.',
  hide: true,
  execute: async function(message, params, yargs) {
    if (!params.length) sendHelp(message, this);

    const auth = await google.auth.getClient({
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/devstorage.read_only"
      ]
    });

    message.channel.send('🚧🚧🚧');
  }
};
