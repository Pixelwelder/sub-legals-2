const getStreakArgs = (message) => {
  const streakDisplayName = message.content.split(' ').slice(1).join(' ');
  const streakName = streakDisplayName.split(' ').join('-').toLowerCase();
  return { streakName, streakDisplayName };
}

module.exports = getStreakArgs;
