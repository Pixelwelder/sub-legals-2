const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { appId, adminGuildId: guildId, botToken } = require('./settings');

module.exports = () => {
  const commandDir = './slash-commands'
  const commands = [];
  const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`${commandDir}/${file}`);
    console.log(' registering command', file.split('.')[0]);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '9' }).setToken(botToken);

  return rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
};
