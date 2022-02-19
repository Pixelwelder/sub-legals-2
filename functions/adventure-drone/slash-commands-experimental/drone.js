const { SlashCommandBuilder } = require('@discordjs/builders');
const { getClient } = require('../client');

const Channels = {
  'station-commons': '860225881083871322',
  'tlh-test': '941289749119901736',
  'general': '685518066402328705'
};
const channelId = Channels['station-commons'];

const formatStatement = (statement) => {
  return `**[${statement}]**`;
};

const formatAction = (action) => {
  return `_${action}_`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drone')
    .setDescription(`Make the drone say something.`)
    .addSubcommand(subcommand => subcommand
      .setName('say')
      .setDescription('Say something in #station-commons.')
      .addStringOption(option => option
        .setName('statement')
        .setDescription('The thing to say')
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName('do')
      .setDescription('Do something in #station-commons.')
      .addStringOption(option => option
        .setName('action')
        .setDescription('The thing to do')
        .setRequired(true)
      )
    ),
    
  // TODO Don't use reply.
  async execute(interaction, character) {
    // This function takes a number and randomly divides it into the specified number of numbers.
    const command = {
      'say': async () => {
        interaction.deferReply({ ephemeral: true });
        const statement = interaction.options.getString('statement');
        console.log('saying', formatStatement(statement));
        const client = getClient();
        const channel = client.channels.cache.get(channelId);
        await channel.send(formatStatement(statement));
        await interaction.editReply('✔️');
      },
      'do': async () => {
        interaction.deferReply({ ephemeral: true });
        const statement = interaction.options.getString('action');
        console.log('doing', formatStatement(statement));
        // const channelId = Channels['station-commons'];
        const client = getClient();
        const channel = client.channels.cache.get(channelId);
        await channel.send(formatAction(statement));
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
