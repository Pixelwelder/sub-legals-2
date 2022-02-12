const wrapArray = require('../utils/wrapArray');

describe('wrapArray', () => {
  test('it should wrap an array', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = wrapArray(array, 3);
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
  });
});