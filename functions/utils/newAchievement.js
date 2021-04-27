const { DateTime } = require('luxon');

module.exports = (overrides) => {
  return {
    displayName: 'Achievement',
    description: 'Achievement description',
    date: DateTime.now().toISO(),
    ...overrides
  };
};
