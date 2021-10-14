/**
 * This does actually alter the user, but it returns it anyway.
 */
module.exports = (user) => {
  if (!user.streaks) user.streaks = [];
  if (!user.achievements) user.achievements = [];
  if (!user.minions) user.minions = [];

  return user;
};
