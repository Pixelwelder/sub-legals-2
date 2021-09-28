const { botToken, adminChannelId } = require('./settings');
const init = require('./adventureDroneInit');
const { getClient } = require('./client-v2');

require('./utils/initFirebase');

const go = async () => {
  console.log('Initializing Drone');
  await init();
  const client = getClient();

  client.once('ready', () => {
    console.log('Ready!');
    const channel = client.channels.cache.get(adminChannelId);
    channel.send('Adventure Drone is ready!');
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  });

  await client.login(botToken);
  // client.Rol
};

go();
