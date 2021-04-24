const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const fileName of commandFiles) {
  const command = require(`./commands/${fileName}`);
  client.commands.set(command.name, command);
}

module.exports = client;
