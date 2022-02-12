const { MessageEmbed, Permissions } = require('discord.js');
const { botToken, adminChannelId, adminGuildId } = require('./adventure-drone/settings');
const init = require('./adventure-drone/init');
const { getClient, fetchGuild } = require('./adventure-drone/client');
const {
  PLAYER_ROLE, ROLE_PREFIX, CATEGORY, START_CHANNEL, ENTRYWAY_CHANNEL
} = require('./adventure-drone/constants');
const rank = require('./utils/rank');
const reactions = require('./adventure-drone/reactions');
const settings = require('./utils/settings');
const channels = require('./utils/channels');
const { getFirestore } = require('firebase-admin/firestore');
const newUser = require('./utils/newUser');
const { UsersManual } = require('@pixelwelders/tlh-universe-data');
const dms = require('./adventure-drone/dms');

require('./utils/initFirebase');

const go = async () => {
  console.log('Initializing Drone');
  const client = getClient();

  client.once('ready', () => {
    console.log('Ready!');
    const channel = client.channels.cache.get(adminChannelId);
    reactions.init();
    dms.init();
    channel.send('Adventure Drone is ready!');
  });

  client.on('interactionCreate', async (interaction) => {
    console.log('interaction');
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

  client.on('guildMemberAdd', async (member) => {
    const guild = await fetchGuild(adminGuildId);
    // const channel = guild.channels.cache.get(START_CHANNEL);
    const role = guild.roles.cache.get(PLAYER_ROLE);
    console.log('guildMemberAdd', member.user.username, member.user.id);

    // Create a new user in the firestore database
    const existing = await getFirestore().collection('discord_users').doc(member.user.id).get();
    if (!existing.exists) {
      await getFirestore().collection('discord_users').doc(member.user.id)
        .set(newUser({ displayName: member.user.username, uid: member.user.id }), { merge: true });
      console.log('new user created');
    } else {
      console.log('user exists: they have returned!');
    }

    // Create an inventory item for the new user.
    // TODO This will create one every time they join.
    const doc = getFirestore().collection('discord_inventory').doc();
    const item = new UsersManual({ uid: doc.id, username: member.user.username, userUid: member.user.id });
    await doc.set(item);

    // Welcome the new user aboard.
    // const channelId = '941289749119901736'; // TLH Test | #game-channel
    const channelId = '685518066402328705'; // TLH | #general
    const channel = client.channels.cache.get(channelId);

    channel.send('Hi ' + member.user.toString() + '! I\'ve taken the liberty of adding a User\'s Manual to your inventory. You can check your inventory by typing `/inventory list`.')
    
    // if (!channel || !role) return;

    // const embed = new MessageEmbed()
    //   .setTitle('Welcome to the Adventure Drone!')
    //   .setDescription(`Welcome, ${member.displayName}!\n\nPlease read the rules and guidelines in <#${ENTRYWAY_CHANNEL}> before you start adventuring.`)
    //   .setColor('#0099ff')
    //   .setTimestamp()
    //   .setFooter('Adventure Drone');

    // member.roles.add(role);
    // channel.send(embed);
  });

  await settings.initialize();
  await rank.initialize();
  channels.initialize(client);
  await client.login(botToken);

  init();

  // Create rooms.
  // TODO This should only happen on setup. Ever.
  // await destroy();
  // await create();
};

go();
