const { Client, Collection, Intents } = require('discord.js');
const fs = require('fs');
const { adminGuildId, tlhGuildId } = require('./settings');
const { getCommands } = require('./commands');

const addCommands = (commandDirs, rootDir, client) => {
  client.commands = new Collection();
  const commands = getCommands(commandDirs, rootDir);
  commands.forEach((command) => {
    client.commands.set(command.data.name, command);
  })
};

let client;
const getClient = () => {
  if (!client) {
    client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
      ]
    });
    addCommands(['slash-commands'], 'adventure-drone', client);
    addCommands(['slash-commands', 'slash-commands-experimental'], 'adventure-drone', client);

    // const commandsDir = 'slash-commands';
    // const commandFiles = fs.readdirSync(`./adventure-drone/${commandsDir}`).filter(file => file.endsWith('.js'));
    // console.log(commandFiles)
    //
    // client.commands = new Collection();
    // for (const file of commandFiles) {
    //   console.log('loading', file)
    //   const command = require(`./${commandsDir}/${file}`);
    //   client.commands.set(command.data.name, command);
    // }
  }

  return client;
};

const fetchGuild = async () => {
  const guild = await client.guilds.cache.get(adminGuildId);
  return guild;
};

module.exports = {
  getClient,
  fetchGuild
};
