const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { appId, tlhGuildId, adminGuildId, botToken } = require('./settings');
const { getCommands } = require('./commands');

const registerCommands = async (commandDirs, guildId) => {
  console.log('registering commands for', guildId);
  const commands = getCommands(commandDirs, 'adventure-drone').map(command => command.data.toJSON());
  const rest = new REST({ version: '9' }).setToken(botToken);

  try {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands });
  } catch (error) {
    console.error(error);
  }
  console.log('-COMPLETE-')
};

module.exports = async () => {
  await registerCommands(['slash-commands'], tlhGuildId);
  await registerCommands(['slash-commands', 'slash-commands-experimental'], adminGuildId);
  console.log('all commands registered');
  // const commandDir = './slash-commands'
  // const commands = [];
  // const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
  //
  // for (const file of commandFiles) {
  //   const command = require(`${commandDir}/${file}`);
  //   console.log(' registering command', file.split('.')[0]);
  //   commands.push(command.data.toJSON());
  // }
  //
  // const rest = new REST({ version: '9' }).setToken(botToken);
  //
  // return rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands })
  //   .then(() => console.log('Successfully registered application commands.'))
  //   .catch(console.error);
};
