const fs = require('fs');

const getCommands = (commandDirs, rootDir) => {
  const commands = commandDirs.reduce((accum, commandDir) => {
    const commandFiles = fs.readdirSync(`./${rootDir}/${commandDir}`).filter(file => file.endsWith('.js'));
    commandFiles.forEach((commandFile) => {
      console.log('-', commandFile);
      const command = require(`./${commandDir}/${commandFile}`);
      accum.push(command);
    })
    return accum;
  }, []);

  return commands;
};

module.exports = { getCommands };
