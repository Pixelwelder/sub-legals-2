const baseTier = 1.8;
const maxTier = 5;
const range = 100000;
const toTier = (xp) => {
  const diff = maxTier - baseTier;
  return (xp / range + baseTier).toFixed(2);
};

module.exports = {
  toTier
};
