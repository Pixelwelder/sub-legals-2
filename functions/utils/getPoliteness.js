const Filter = require('bad-words');
const filter = new Filter();

// Idea: they hear all profanity and adjust their feelings for you accordingly.
// Could do that with reactions!!

// pronouns!
// poke another user

/**
 * Politeness ranges from -1 to 1.
 *
 * @param messageStr - The complete command string, with prefix.
 */
module.exports = (commandStr) => {
  const processedCommandStr = commandStr.toLowerCase();

  // TODO easily abused, e.g. "please kill yourself"
  if (processedCommandStr.includes('please')) return 0.5;
  if (processedCommandStr.includes('thank')) return 0.5;

  return 0;
};
