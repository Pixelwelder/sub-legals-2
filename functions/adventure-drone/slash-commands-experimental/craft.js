const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow, MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getClient } = require('../client');

const time = 30 * 1000;

const Progress = {
  MAIN_MENU: 0,
  MINION: 1
};

function Thread() {
  return {
    created: new Date().getTime(),
    updated: new Date().getTime(),
    progress: 0
  };
}

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/discord/ui';
const getImage = ({ progress }) => {
  return `${imageRoot}/nanoforge.jpg`;
};

const getMainMenuEmbed = (thread) => {
  
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | ONLINE')
    .setDescription('What would you like to craft?')
    .setImage(getImage(thread));

  const actionRow = new MessageActionRow();
  const buttons = [
    new MessageButton()
      .setCustomId('craft-minion')
      .setLabel('Minion')
      .setStyle('SECONDARY')
  ];

  actionRow.addComponents(buttons);

  return { content: 'Forge has powered up.', embeds: [embed], components: [actionRow] };
};

const getMinionEmbed = (thread) => {
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle('NANOFORGE | CREATE MINION')
    .setImage(getImage(thread));

    const actionRow = new MessageActionRow();
    const buttons = [
      new MessageButton()
        .setCustomId('back-to-main-menu')
        .setLabel('< Back')
        .setStyle('SECONDARY')
    ];
  
    actionRow.addComponents(buttons);
  
    return { content: 'Forge has switched to Minion Mode.', embeds: [embed], components: [actionRow] };
};

const getResponse = (thread) => {
  const embedFactory = {
    [Progress.MAIN_MENU]: getMainMenuEmbed,
    [Progress.MINION]: getMinionEmbed
  }[thread.progress];

  if (embedFactory) return embedFactory(thread);
};

const getThread = async (id) => {
  // Do we have an in-flight UI thread?
  let threadRef = getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(id);
  const threadDoc = await threadRef.get();
  return threadDoc.exists ? threadDoc.data() : new Thread();
};

const respond = async (interaction, state = {}) => {
  const {
    thread: _thread
  } = state;

  const thread = _thread || await getThread(interaction.member.id);
  const response = getResponse(thread);
  interaction.editReply(response);

  // ------------------------------- HANDLERS ------------------------------------
  const filterButtons = i => i.user.id === interaction.member.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });

    switch (customId) {
      case 'craft-minion': {
        // Save thread progress.
        const newThread = { ...thread, progress: Progress.MINION, updated: new Date().getTime() };
        await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        respond(interaction, { thread: newThread });
        break;
      }

      case 'back-to-main-menu': {
        const newThread = { ...thread, progress: Progress.MAIN_MENU, updated: new Date().getTime() };
        await getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(interaction.member.id).set(newThread);
        respond(interaction, { thread: newThread });
        break;
      }

      default: {
        // TODO Reset?
        break;
      }
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
      // Out of time. Clear the response.
      await interaction.editReply({ embeds: [], components: [], content: 'The forge has powered down.' });
    }
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('craft')
    .setDescription(`Craft an item.`),
    
  async execute(interaction, character) {
    await interaction.deferReply({ ephemeral: true });
    respond(interaction);
  }
};
