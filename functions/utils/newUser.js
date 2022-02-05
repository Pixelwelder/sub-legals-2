module.exports = (overrides) => {
  return {
    numMessages: 0,
    xp: 0,
    opinion: 9,
    achievements: [],
    streaks: [],
    minions: [],
    inventory: [],
    meta: {},
    displayName: '',
    ...overrides
  };
};
