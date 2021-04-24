const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
  name: 'help',
  usage: 'help',
  description: 'Lists the commands this drone is capable of understanding.',
  execute: (message) => {
    const { client } = message;
    const fields = client.commands
      .filter(({ name }) => !['invalid'].includes(name))
      .filter(({ hide }) => !hide)
      .map(command => ({
        name: command.name,
        value: `"${command.usage}" - ${command.description}`
      }));

    const embed = new Discord.MessageEmbed()
      .setColor('0x000000')
      .setTitle('Network Drone: Help v457')
      .setDescription('Hello! I am a Network Drone. I can understand the following commands:')
      .addFields(fields);

    message.channel.send(embed);
  }
};
