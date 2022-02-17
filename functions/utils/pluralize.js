const pluralize = (word = '') => {
  if (!word) return '';

  // Special cases.
  if (word.endsWith('is')) return word;

  // Everything else.
  return word.endsWith('s') ? `${word}es` : `${word}s`;
}

module.exports = pluralize;
