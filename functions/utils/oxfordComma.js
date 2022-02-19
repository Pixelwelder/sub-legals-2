// Convert an array of strings to a single string with an Oxford comma.
const oxfordComma = (strings, conjunction = 'and') => {
  if (strings.length === 1) return strings[0];
  if (strings.length === 2) return `${strings[0]} ${conjunction} ${strings[1]}`;
  return `${strings.slice(0, -1).join(', ')}, ${conjunction} ${strings[strings.length - 1]}`;
}

module.exports = oxfordComma;
