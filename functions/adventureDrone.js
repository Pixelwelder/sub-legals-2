const { botToken, adminChannelId, adminGuildId } = require('./settings');
// const init = require('./adventureDroneInit');
const { getClient } = require('./client-v2');

require('./utils/initFirebase');

const CATEGORY = 'adventure';
const START_CHANNEL = 'airlock';

const create = async () => {
  const client = getClient();
  const guild = await client.guilds.cache.get(adminGuildId);
  const category = await guild.channels.create(CATEGORY, { type: 'GUILD_CATEGORY' });
  const start = await guild.channels.create(START_CHANNEL, { parent: category.id });
  console.log('category', category);
};

const destroy = async () => {
  const client = getClient();
  const guild = await client.guilds.cache.get(adminGuildId);
  const channels = await guild.channels.fetch();

  // TODO This can be vastly improved.
  const category = channels.find(({ type, name }) => (type === 'GUILD_CATEGORY' && name === CATEGORY));
  if (!category) {
    console.log('Nothing to destroy');
    return;
  }

  const toDelete = channels.filter(({ parentId }) => parentId === category.id);
  toDelete.forEach(channel => {
    channel.delete();
  });

  category.delete();
};

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

  // Create rooms.
  // TODO This should only happen on setup. Ever.
  await destroy();
  await create();
};

go();
