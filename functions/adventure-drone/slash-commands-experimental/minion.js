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
    .setName('minion')
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
    const discordUser = interaction.user;
    const minions = await fetchMinions();
    const minionsByName = await fetchMinionsByName();
    // console.log('minions', minions);
    const command = {
      'list': async () => {
        const embed = new MessageEmbed()
          .setColor('0x000000')
          .setTitle(`Available Minions`);

        const fields = minions
          .filter(({ mentor }) => !mentor)
          .reduce((accum, minion) => ([
            ...accum,
            { name: 'Name', value: minion.displayName }
          ]), []);

        embed.addFields(fields);
        interaction.reply({ embeds: [embed] });
      },
      'hire': async () => {
        const name = interaction.options.getString('name');
        const minion = minionsByName[name.toLowerCase()];
        if (!minion) {
          interaction.reply(`There doesn't seem to be a minion named '${name}.'`);
          return;
        }

        if (minion.mentor) {
          if (minion.mentor === discordUser.id) {
            interaction.reply(`You've already hired ${name}.`);
          } else {
            const mentor = client.users.cache.get(discordUser.id);
            if (!mentor) {
              // TODO This shouldn't happen. The user has left, I assume...?
              interaction.reply(`It appears ${name} has been abandoned.`);
            } else {
              interaction.reply(`${name} has already been hired by ${mentor.username}.`);
              return;
            }
          }
        }

        minion.mentor = discordUser.id;
        await admin.firestore().collection('discord_minions').doc(minion.uid).update(minion);
        interaction.reply(`${name} is now your minion.`);
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
