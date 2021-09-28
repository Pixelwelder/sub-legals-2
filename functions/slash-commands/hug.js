const { SlashCommandBuilder } = require('@discordjs/builders');
const sendHelp = require('../utils/sendHelp');
const { getClient } = require('../client-v2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Instruct this drone to hug a station resident.')
    .addUserOption(option => option
      .setName('resident')
      .setDescription('The individual in question.')
      .setRequired(true)),
  async execute(interaction) {
    const client = getClient();
    const { id } = interaction.options.getUser('resident');
    const user = client.users.cache.get(id);
    console.log(user);

    interaction.channel.send(`_enfolds <@${id}> in a mechanical embrace (at <@${interaction.user.id}>'s request)_`);
    interaction.reply({ content: 'Hug deployed!', ephemeral: true });
  }
};
