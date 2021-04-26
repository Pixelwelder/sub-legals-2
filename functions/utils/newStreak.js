const { DateTime } = require('luxon');

module.exports = (overrides) => {
  const nowStamp = DateTime.now().toISO();
  return {
    created: nowStamp,
    displayName: 'Streak',
    description: 'Streak description',
    current: 1,
    longest: 1,
    total: 1,
    checkIns: [nowStamp],
    ...overrides
  };
};
