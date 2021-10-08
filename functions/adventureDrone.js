const { MessageEmbed, Permissions } = require('discord.js');
const { botToken, adminChannelId, adminGuildId } = require('./settings');
const init = require('./adventure-drone/init');
const { getClient, fetchGuild } = require('./adventure-drone/client');
const {
  PLAYER_ROLE, ROLE_PREFIX, CATEGORY, START_CHANNEL, ENTRYWAY_CHANNEL
} = require('./adventure-drone/constants');
const rank = require('./utils/rank');

require('./utils/initFirebase');

// Turn a list of items into a string.
const listToString = items => items.reduce((accum, item) => `${accum}\n${item}`, '');

const create = async () => {
  // const client = getClient();
  const guild = await fetchGuild();

  // Create roles.
  const playerRole = await guild.roles.create({ name: PLAYER_ROLE, hoist: true, mentionable: true });

  // const allRoles = await guild.roles.fetch();
  // const everyoneRole = guild.roles.everyone;

  // Create rooms.
  const category = await guild.channels.create(CATEGORY, { type: 'GUILD_CATEGORY' });
  const promises = [START_CHANNEL, ENTRYWAY_CHANNEL].map(async (channelName) => {
    const role = await guild.roles.create({ name: `${ROLE_PREFIX}${channelName}`, hoist: false, mentionable: false });
    const channel = await guild.channels.create(
      channelName,
      {
        parent: category.id,
        topic: channelName,
        permissionOverwrites: [
          // Deny everyone.
          {
            id: guild.id,
            deny: [Permissions.FLAGS.VIEW_CHANNEL]
          },
          // Allow Adventure Drone.
          {
            id: guild.me.roles.highest,
            allow: [Permissions.FLAGS.VIEW_CHANNEL]
          },
          // Allow player.
          {
            id: playerRole.id,
            allow: [Permissions.FLAGS.VIEW_CHANNEL]
          }
        ]
      }
    );
  });
  await Promise.all(promises);

  // const items = ['Wrench', 'Sandwich', 'Suspicious Paper'];
  // const people = ['Drone Service Manager', 'Drone #650'];
  // const embed = new MessageEmbed()
  //   .setColor('0x000000')
  //   .setTitle('Airlock #40')
  //   .setDescription(`Even the fanciest, most upmarket airlock in the galaxy will begin to show some wear after a century or two of heavy use. This one had seen better days even before the disaster.`)
  //   // .setImage('https://i.imgur.com/q8XgKYc.jpg')
  //   .setImage('https://cdn.discordapp.com/attachments/885654707798962227/892558926111993856/test_airlock.png')
  //   .addFields(
  //     { name: 'Exits', value: 'There is a door to the north.' },
  //     // { name: '\u200B', value: '\u200B' },
  //     { name: 'People', value: listToString(people), inline: true },
  //     { name: 'Items', value: listToString(items), inline: true },
  //   );
  // startChannel.send({ embeds: [embed] });
};

const destroy = async () => {
  const client = getClient();
  const guild = await client.guilds.cache.get(adminGuildId);
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  // Remove roles.
  roles.forEach((role) => {
    if (role.name.startsWith(ROLE_PREFIX) || role.name === PLAYER_ROLE) role.delete();
  });

  // Remove adventure categories and channels.
  // TODO This can be vastly improved.
  const category = channels.find(({ type, name }) => (type === 'GUILD_CATEGORY' && name === CATEGORY));
  if (!category) {
    console.log('Nothing to destroy');
    return;
  }

  const channelsToRemove = channels.filter(({ parentId }) => parentId === category.id);
  channelsToRemove.forEach(channel => {
    console.log('deleting', channel.name);
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

  init();
  await rank.initialize();

  // Create rooms.
  // TODO This should only happen on setup. Ever.
  // await destroy();
  // await create();
};

go();
