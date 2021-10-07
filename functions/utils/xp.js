const baseTier = 1.8;
// const maxTier = 5;
const range = 100000;
const floor = 1.8;
const toTier = (xp, multiplier = 0.001, floor = 1.8) => {
  // const diff = maxTier - baseTier;
  const base = Math.log(12);
  return ((Math.log(1 + xp * multiplier) / base) + floor).toFixed(2);
};

console.log(toTier(0));
console.log(toTier(350000));

module.exports = {
  toTier
};
