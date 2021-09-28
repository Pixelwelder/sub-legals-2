const { Client, Collection, Intents } = require('discord.js');
const fs = require('fs');
const init = require('./adventureDroneInit');

let client;

const getClient = () => {
  if (!client) {
    client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    const commandsDir = './slash-commands';
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    client.commands = new Collection();
    for (const file of commandFiles) {
      console.log('loading', file)
      const command = require(`${commandsDir}/${file}`);
      client.commands.set(command.data.name, command);
    }
  }

  return client;
}

module.exports = {
  getClient
};
