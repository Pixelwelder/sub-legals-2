const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const admin = require('firebase-admin');
const newUser = require('../../utils/newUser')
const fixUser = require('../../utils/fixUser');
const getOpinionImage = require('../../utils/getOpinionImage');

const getUser = async (id) => {
  const ref = admin.firestore().collection('discord_users').doc(id);
  const userDoc = await transaction.get(ref);
  const user = fixUser(userDoc.exists ? userDoc.data() : newUser());

  return user;
};

let minions;
const getMinions = async () => {
  if (!minions) {
    const minionDocs = await admin.firestore().collection('discord_minions').get();
    const minions = minionDocs.docs.map(doc => doc.data());
    return minions;
  }
};

// Load
getMinions();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minion')
    .setDescription(`Hire, fire, and care for a minion.`)
    .addSubcommand(subcommand => subcommand
      .setName('list')
      .setDescription('List all available minions.'))
    .addSubcommand(subcommand => subcommand
      .setName('hire')
      .setDescription('Hire a minion.')
      // TODO Maybe this could be dynamic based on who's available?
      .addStringOption(option => option
        .setName('name')
        .setDescription('The minion to hire')
      )),

  async execute(interaction) {
    const discordUser = interaction.user;
    const minions = await getMinions();
    // console.log('minions', minions);
    const command = {
      'list': async () => {
        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`Available Minions`);

        const fields = minions.reduce((accum, minion) => ([
          ...accum,
          { name: 'Name', value: minion.displayName }
        ]), []);

        embed.addFields(fields);
        interaction.reply({ embeds: [embed] });
      },
      'hire': async () => {
        const name = interaction.options.getString('name');
        interaction.reply(`Hiring ${name}...`);
      },
      'fire': async () => {
        const name = interaction.options.getString('name');
        interaction.reply(`Firing ${name}...`);
      }
    }[interaction.options.getSubcommand()];

    if (command) await command();
    console.log('Command complete')
  }
};
