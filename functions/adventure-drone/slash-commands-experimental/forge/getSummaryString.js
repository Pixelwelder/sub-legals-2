// Takes a stats object and returns a string that summarizes it.
const getSummaryString = (stats = {}) => {
  const str = Object.entries(stats).reduce((acc, [_name, _value], index) => {
    const name = _name.charAt(0).toUpperCase();
    const value = _value > 0 ? `+${_value}` : _value;
    const string = `${value}${name}`;
    return acc ? `${acc} ${string}` : string;
  }, '');

  console.log('summary string', str);
  return str;
};

module.exports = getSummaryString;
