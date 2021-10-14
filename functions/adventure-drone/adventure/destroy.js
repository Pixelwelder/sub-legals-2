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

module.exports = destroy;
