// Wrap an array into two dimensions. Each row should contain a specified number of items.
const wrapArray = (array, length) => {
  const result = [];
  for (let i = 0; i < array.length; i += length) {
    result.push(array.slice(i, i + length));
  }
  return result;
}

module.exports = wrapArray;
