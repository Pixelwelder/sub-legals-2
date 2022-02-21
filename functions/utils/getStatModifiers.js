const { capitalize } = require('@pixelwelders/tlh-universe-util');

const getStatModifiers = (statModifiers) => {
  const statString = Object.entries(statModifiers).reduce((acc, [_name, _value], index) => {
    const name = capitalize(_name);
    const value = _value > 1 ? `+${_value}` : _value;
    const string = `${value} ${name}`;
    return acc ? `${acc}, ${string}` : string;
  }, '');

  return statString;
};

module.exports = getStatModifiers;
