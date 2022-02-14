// Takes a number and returns the ordinal version of it.
const ordinal = (num) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const mod = num % 100;
  return num + (suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0]);
};

module.exports = ordinal;
