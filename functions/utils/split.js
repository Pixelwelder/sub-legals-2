const split = (num, numParts) => {
  const parts = new Array(numParts).fill(0);
  for (let i = 0; i < num; i++) {
    const part = Math.floor(Math.random() * numParts);
    parts[part]++;
  }

  return parts;
}

module.exports = split;
