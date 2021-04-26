module.exports = (overrides) => {
  return {
    opinion: 5,
    achievements: [],
    streaks: [],
    ...overrides
  };
};
