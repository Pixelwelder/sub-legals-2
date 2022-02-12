const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, MessageActionRow, ContextMenuInteraction } = require("discord.js");
const { getFirestore } = require('firebase-admin/firestore');
const { Character } = require('@pixelwelders/tlh-universe-data');
const wrapArray = require('../../utils/wrapArray');

const StatNames = {
  STRENGTH: 'strength',
  PERCEPTION: 'perception',
  ENDURANCE: 'endurance',
  CHARISMA: 'charisma',
  INTELLIGENCE: 'intelligence',
  AGILITY: 'agility',
  LUCK: 'luck'
};

const StatIndexes = {
  [StatNames.STRENGTH]: 0,
  [StatNames.PERCEPTION]: 1,
  [StatNames.ENDURANCE]: 2,
  [StatNames.CHARISMA]: 3,
  [StatNames.INTELLIGENCE]: 4,
  [StatNames.AGILITY]: 5,
  [StatNames.LUCK]: 6
};

const fullSquare = '🟥';
const emptySquare = '⬛';
const fullPoint = '🔴';
const emptyPoint = '⚫';
// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (num, max, full = fullSquare, empty = emptySquare) => {
  return `${full.repeat(num)}${empty.repeat(max - num)}`;
};

const getCharacterEmbed = (interaction, { character, statChanges } = {}) => {
  const showStats = true;
  const inline = false;
  const avatarUrl = interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 });

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(character.displayName)
    .setImage(avatarUrl);

  if (showStats) {
    const fields = character.stats.map((stat, index) => {
      let value = getBar(stat.value, stat.max);
      if (statChanges && statChanges[index]) {
        value = `${value} ${fullPoint.repeat(statChanges[index])}`;
      }

      return { name: stat.displayName, value, inline };
    });

    if (character.statPoints > 0) {
      // Add all stat changes
      const statsUsed = statChanges.reduce((acc, stat) => acc + stat);
      fields.push({
        name: 'Available points',
        value: getBar(character.statPoints - statsUsed, character.statPoints, fullPoint, emptyPoint),
        inline
      });
    }

    // fields.push({ name: 'Available points', value: getBar(character.statPoints, character.statPoints, point) });
    embed.setFields(fields);
  }

  return embed;
};

const getUtilButtons = (interaction, { character }) => {
  const actionRow = new MessageActionRow();

  const buttons = [];
  if (character.statPoints > 0) {
    buttons.push(
      new MessageButton()
        .setCustomId('applyPoints')
        .setLabel(`Apply ${character.statPoints} Points`)
        .setStyle('SECONDARY')
    )
  }

  return buttons.length ? [actionRow.addComponents(...buttons)] : [];
};

const getStatButtons = (interaction, { character, statChanges } = {}) => {
  // Turn stats into MessageActionRows with five MessageButtons each.
  const stats2D = wrapArray(character.stats, 5);
  const components = stats2D.map((row) => {
    const actionRow = new MessageActionRow();
    row.forEach((stat) => {
      actionRow.addComponents(
        new MessageButton()
          .setCustomId(stat.displayName.toLowerCase())
          .setLabel(`+ ${stat.displayName}`)
          .setStyle('SECONDARY')
      )
    });
    return actionRow;
  });

  // Now create a row of utility buttons.
  const statsUsed = statChanges.reduce((acc, stat) => acc + stat);
  const utilityRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('applyPointsSave')
        .setLabel(`Apply ${statsUsed} Points`)
        .setDisabled(statsUsed === 0)
        .setStyle('SUCCESS'),
      new MessageButton()
        .setCustomId('applyPointsReset')
        .setLabel('Reset')
        .setDisabled(statsUsed === 0)
        .setStyle('DANGER'),
      new MessageButton()
        .setCustomId('applyPointsCancel')
        .setLabel('Cancel')
        .setStyle('SECONDARY')
    )

  return [...components, utilityRow];
};

const CharacterEmbedModes = {
  NORMAL: 'normal',
  EDIT_STATS: 'edit-stats'
};

const showCharacter = async (
  interaction,
  state = {}
) => {
  const {
    ephemeral = true,
    mode = CharacterEmbedModes.NORMAL,
    character: _character = null,
    statChanges = [0, 0, 0, 0, 0, 0, 0] // Change per stat.
  } = state;
  console.log('');
  console.log('showCharacter', state);

  // Get the character if we don't have.
  let character = _character;
  if (!_character) {
    // Get the character and bail early if we don't have one.
    const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.member.id).get();
    if (characterDocs.empty) {
      return interaction.editReply(`You don't have a character yet. Use \`/character create\` to create one.`);
    }

    character = characterDocs.docs[0].data();
  }

  const embed = getCharacterEmbed(interaction, { character, statChanges });

  // Get buttons based on state.
  const getComponents = {
    [CharacterEmbedModes.NORMAL]: getUtilButtons,
    [CharacterEmbedModes.EDIT_STATS]: getStatButtons
  }[mode]

  // Now get the buttons.
  const components = getComponents(interaction, { character, statChanges });

  // Send the embed.
  const message = await interaction.editReply({ embeds: [embed], components });

  // ------------------------------- HANDLERS ------------------------------------
  // Now listen for button presses.
  const filterButtons = i => i.user.id === interaction.member.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time: 15000 });

  collector.on('collect', async i => {
    const { customId } = i.component;
    collector.stop();

    console.log('customId', customId);
    const newState = { ...state, ephemeral, mode, character, statChanges: [...statChanges] };
    switch (customId) {
      case 'applyPoints':
        newState.mode = CharacterEmbedModes.EDIT_STATS;
        break;

      case 'applyPointsCancel':
        newState.mode = CharacterEmbedModes.NORMAL;
        newState.statChanges = [0, 0, 0, 0, 0, 0, 0];
      break;

      case 'applyPointsReset':
        newState.statChanges = [0, 0, 0, 0, 0, 0, 0];
        break;

      case 'applyPointsSave': {
        // Add stat changes to character.
        const statsUsed = newState.statChanges.reduce((acc, stat) => acc + stat);
        const newStats = character.stats.map((stat, index) => {
          return { ...stat, value: stat.value + statChanges[index]};
        });
        const newCharacter = { ...character, stats: newStats, statPoints: character.statPoints - statsUsed };
        await getFirestore().collection('discord_characters').doc(character.uid).set(newCharacter, { merge: true });

        newState.mode = CharacterEmbedModes.NORMAL;
        newState.character = newCharacter;
        newState.statChanges = [0, 0, 0, 0, 0, 0, 0];
        break;
      }

      case StatNames.STRENGTH:
      case StatNames.PERCEPTION:
      case StatNames.ENDURANCE:
      case StatNames.CHARISMA:
      case StatNames.INTELLIGENCE:
      case StatNames.AGILITY:
      case StatNames.LUCK:
        const index = StatIndexes[customId];
        newState.statChanges[index] ++;
        break;

      default:
        newState.mode = CharacterEmbedModes.NORMAL;
        break;
    }
    
    if (newState.mode !== mode) {
      // Blank the buttons to avoid a bug.
      await i.update({ components: [] });
    } else {
      await i.update({ content: `Added +1 ${customId}` });
    }

    // Start it all over again.
    console.log('setting mode', newState.statChanges);
    showCharacter(interaction, newState);
    // await i.update({ content: 'A button was clicked! ' + Math.random() });
  });

  collector.on('end', collected => console.log(`Collected ${collected.size} items`));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('c2')
    .setDescription(`Do stuff with your character.`)
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create your character (private).')
    )
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine your character (private).')
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Show your character to the room (public).')
    )
    .addSubcommand(subcommand => subcommand
      .setName('kill')
      .setDescription('Kill your character (private).')
    ),
    
  // TODO Don't use reply.
  async execute(interaction, character) {
    // This function takes a number and randomly divides it into the specified number of numbers.
    const split = (num, numParts) => {
      // Create an array of zeroes.
      const parts = new Array(numParts).fill(0);
      // Loop num number of times.
      for (let i = 0; i < num; i++) {
        // Pick a random part.
        const part = Math.floor(Math.random() * numParts);
        // Increment that part.
        parts[part]++;
      }

      return parts;
    }

    const command = {
      'create': async () => {
        // Defer the reply, just in case.
        await interaction.deferReply({ ephemeral: true });

        const userUid = interaction.member.id;
        const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.user.id).get();
        if (!characterDocs.empty) {
          return interaction.editReply(`You already have a character. Use \`/character examine\` to see them.`);
        }

        const ref = characterDocs.size > 0 ? characterDocs.docs[0].ref : getFirestore().collection('discord_characters').doc();

        // Create the character.
        const character = new Character({
          uid: ref.id,
          displayName: interaction.user.username,
          player: interaction.user.id,
          statPoints: 0
        });

        // Assign random stats.
        const numPoints = 21;
        const parts = split(21, 7);
        character.stats.forEach((stat, index) => { stat.value = parts[index]; });
        
        // Save.
        await ref.set(character, { merge: true });
        
        // Display.
        await showCharacter(interaction);
      },
      'examine': async () => {
        await interaction.deferReply({ ephemeral: true });
        await showCharacter(interaction);
      },
      'show': async () => {
        // Check first.
        const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.user.id).get();
        if (characterDocs.empty) {
          return interaction.reply(`You don't have a character. Use \`/character create\` to create one.`);
        }

        await interaction.deferReply({ ephemeral: false });
        await showCharacter(interaction, { ephemeral: false, doc: characterDocs.docs[0] }); // TODO Figure out how to not do this
      },
      'kill': async () => {
        await interaction.deferReply({ ephemeral: true });
        // Remove from firebase.
        const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.user.id).get();
        if (characterDocs.empty) {
          await interaction.editReply({ content: 'You have no character to kill. Use `/character create` to create one.' });
        } else {
          await characterDocs.docs[0].ref.delete();
          await interaction.editReply({ content: 'You killed your character. You monster.' });
        }
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