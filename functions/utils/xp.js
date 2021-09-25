const baseTier = 1.8;
// const maxTier = 5;
const range = 100000;
const floor = 88;
const toTier = (xp) => {
  // const diff = maxTier - baseTier;
  // return (xp / range + baseTier).toFixed(2);

  return Math.log(xp + floor) / Math.log(12);
};

module.exports = {
  toTier
};
