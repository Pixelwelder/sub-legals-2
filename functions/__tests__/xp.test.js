const xp = require('../utils/xp');

describe('xp', () => {
  test('it should output the correct tier', () => {
    console.log(xp.toTier(0));
    console.log(xp.toTier(50000));
  });
});
