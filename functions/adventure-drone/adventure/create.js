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

module.exports = create;
