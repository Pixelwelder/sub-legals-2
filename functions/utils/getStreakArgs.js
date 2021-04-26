const yargs = require('yargs');

const getStreakArgs = (message) => {
  const args = yargs.parse(message.content);
  const name = args._.slice(1).join(' ');
  console.log('args', args);

  return { name, args };
}

module.exports = getStreakArgs;
