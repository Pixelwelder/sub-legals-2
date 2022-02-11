const { Client, Intents } = require('discord.js');

let client;
const getClient = () => {
  if (!client) {
    client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES
      ]
    });
  }

  return client;
};

module.exports = { getClient };
