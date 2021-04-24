const { DateTime } = require('luxon');

module.exports = (overrides) => {
  return {
    name: 'achievement',
    displayName: 'Achievement',
    description: 'Achievement description',
    date: DateTime.now().toISO(),
    ...overrides
  };
};
