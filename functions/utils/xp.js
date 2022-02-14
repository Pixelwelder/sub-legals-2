const baseTier = 1.8;
// const maxTier = 5;
const range = 100000;
const floor = 1.8;
const toTier = (xp, multiplier = 0.0001, floor = 1.8) => {
  // const diff = maxTier - baseTier;
  const base = Math.log(12);
  const boost = 120;
  return ((Math.log(1 + (xp + boost) * multiplier) / base) + floor).toFixed(2);
};

module.exports = {
  toTier
};
