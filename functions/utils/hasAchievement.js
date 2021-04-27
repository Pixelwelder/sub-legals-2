module.exports = (user, achievementName) => {
  const achievementsByName = user.achievements
    .reduce((accum, ach) => ({ ...accum, [ach.displayName.toLowerCase()]: ach}), {});
  return !!achievementsByName[achievementName.toLowerCase()];
};
