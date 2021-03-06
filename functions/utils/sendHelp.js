const Discord = require('discord.js');
const { prefix } = require('./settings');

module.exports = (message, { name, usage, description }) => {
  const help = new Discord.MessageEmbed()
    .setColor('0x000000')
    .setTitle(`❓ ${name} command`)
    .setDescription(description)
    .addFields([{ name: 'usage', value: `${prefix}${usage}` }]);

  message.channel.send(help);
};
