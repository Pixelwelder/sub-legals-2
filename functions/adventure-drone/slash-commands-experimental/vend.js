const { SlashCommandBuilder } = require("@discordjs/builders");
const { getClient } = require("../client");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vend')
    .setDescription(`Request an item from the drone.`)
    .addSubcommand(subcommand => subcommand
      .setName('commons')
      .setDescription('Say something in #station-commons.')
      .addStringOption(option => option
        .setName('statement')
        .setDescription('The thing to say')
        .setRequired(true)
      )
    ),
    
  // TODO Don't use reply.
  async execute(interaction, character) {
    // This function takes a number and randomly divides it into the specified number of numbers.
    const command = {
      'commons': async () => {
        interaction.deferReply({ ephemeral: true });
        const statement = interaction.options.getString('statement');
        console.log('saying', statement);
        const channelId = Channels['station-commons'];
        // const channelId = Channels['tlh-test'];
        const client = getClient();
        const channel = client.channels.cache.get(channelId);
        await channel.send(statement);
        await interaction.editReply('✔️');
      }
    }[interaction.options.getSubcommand()];

    if (command) {
      try {
        await command();
      } catch (e) {
        console.error(e);
        interaction.editReply('Oops, something went wrong.');
      } finally {
        console.log('Command complete');
      }
    }
  }
};
