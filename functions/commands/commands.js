const fs = require('fs');
const reply = require('../utils/getReplyFunction');

module.exports = (message) => {
  fs.readdir('./commands', (err, files) => {
    const commands = files
      .map(file => file.slice(0, -3))
      .filter(command => !['invalid', 'index'].includes(command));
    reply(commands.join(' | '));
  })
};
