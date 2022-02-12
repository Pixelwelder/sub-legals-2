const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const admin = require('firebase-admin');
const newUser = require('../../utils/newUser')
const fixUser = require('../../utils/fixUser');
const getOpinionImage = require('../../utils/getOpinionImage');
const { fetchMinions, fetchMinionsByName } = require('../slash-commands-common/minion-common');

const getUser = async (id) => {
  const ref = admin.firestore().collection('discord_users').doc(id);
  const userDoc = await transaction.get(ref);
  const user = fixUser(userDoc.exists ? userDoc.data() : newUser());

  return user;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('m2')
    .setDescription(`Hire, fire, and care for a minion.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List your minions.'))
    .addSubcommand(subcommand => subcommand
      .setName('hire')
      .setDescription('Hire a minion.')
      // TODO Maybe this could be dynamic based on who's available?
      .addStringOption(option => option
        .setName('name')
        .setDescription('The minion to hire')
      )),

  async execute(interaction) {
    const command = {
      
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
}