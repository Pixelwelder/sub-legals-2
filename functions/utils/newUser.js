module.exports = (overrides) => {
  return {
    numMessages: 0,
    opinion: 4,
    achievements: [],
    streaks: [],
    ...overrides
  };
};
