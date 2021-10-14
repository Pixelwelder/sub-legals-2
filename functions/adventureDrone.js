const { MessageEmbed, Permissions } = require('discord.js');
const { botToken, adminChannelId, adminGuildId } = require('./adventure-drone/settings');
const init = require('./adventure-drone/init');
const { getClient, fetchGuild } = require('./adventure-drone/client');
const {
  PLAYER_ROLE, ROLE_PREFIX, CATEGORY, START_CHANNEL, ENTRYWAY_CHANNEL
} = require('./adventure-drone/constants');
const rank = require('./utils/rank');

require('./utils/initFirebase');

const go = async () => {
  console.log('Initializing Drone');
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
      return interaction.reply({ content: 'Ouch. Something went wrong.', ephemeral: true });
    }
  });

  await client.login(botToken);

  init();
  await rank.initialize();

  // Create rooms.
  // TODO This should only happen on setup. Ever.
  // await destroy();
  // await create();
};

go();
