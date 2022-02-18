const admin = require('firebase-admin');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchMinions, fetchMinionsByName, newMinion, refreshMinions } = require('../slash-commands-common/minion-common');
const { capitalize } = require('@pixelwelders/tlh-universe-util')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminion')
    .setDescription(`Administrate minions.`)
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create a minion.')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The minion to create.')
      ))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Delete a minion.')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The minion to delete.')
      )),

  async execute(interaction) {
    const minions = await fetchMinions();
    const minionsByName = await fetchMinionsByName();
      const command = {
        'create': async () => {
          const rawName = interaction.options.getString('name');
          const name = capitalize(rawName);
          const minion = minionsByName[rawName.toLowerCase()];
          if (minion) {
            interaction.reply(`A minion named '${name}' already exists.`);
            return;
          }

          const doc = admin.firestore().collection('discord_minions').doc();
          const createdMinion = newMinion({
            uid: doc.id,
            displayName: name
          });
          await doc.create(createdMinion);
          await refreshMinions();

          interaction.reply(`Created new minion ${name}.`)
        },
        'delete': async () => {
          const rawName = interaction.options.getString('name');
          const minion = minionsByName[rawName.toLowerCase()];
          console.log('minions', minionsByName);
          if (!minion) {
            interaction.reply(`No minion named '${capitalize(rawName)}'.`);
            return;
          }

          // TODO Idiotproof.
          await admin.firestore().collection('discord_minions').doc(minion.uid).delete();
          interaction.reply(`Minion '${name} has been deleted.`);
        }
      }[interaction.options.getSubcommand()];

      if (command) await command();
      console.log('Command complete');
  }
}
