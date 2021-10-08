const { Client, Collection, Intents } = require('discord.js');
const fs = require('fs');
const { adminGuildId, tlhGuildId } = require('./settings');
const { getCommands } = require('./commands');

const addCommands = (commandDirs, rootDir, client) => {
  client.commands = new Collection();
  const commands = getCommands(commandDirs, rootDir);
  commands.forEach((command) => {
    console.log('+', command);
    console.log('=======');
    client.commands.set(command.data.name, command);
  })
};

let client;
const getClient = () => {
  if (!client) {
    client = new Client({ intents: [Intents.FLAGS.GUILDS] });
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
