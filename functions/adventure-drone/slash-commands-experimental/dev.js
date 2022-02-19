const { SlashCommandBuilder } = require('@discordjs/builders');
const store = require('../store');
const { actions: devActions } = require('../store/dev');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription(`Dev stuff.`)
    .addSubcommand(subcommand => subcommand
      .setName('give')
      .setDescription('Give an inventory item to another user.')
      .addStringOption(option => option
        .setName('constructor')
        .setDescription('The Constructor of the item to give.')
        .setRequired(true)
      )),
    
  // TODO Don't use reply.
  async execute(interaction, character) {
    // This function takes a number and randomly divides it into the specified number of numbers.
    const command = {
      'give': async () => {
        await interaction.deferReply({ ephemeral: true });

        const ConstructorName = interaction.options.getString('constructor');
        const userId = interaction.member.id;
        await store.dispatch(devActions.give({ ConstructorName, userId }));

        await interaction.editReply({ content: `Gave ${ConstructorName} to <@${userId}>.` });
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
