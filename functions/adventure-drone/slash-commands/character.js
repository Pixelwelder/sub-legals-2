const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, MessageActionRow, ContextMenuInteraction } = require("discord.js");
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { Character } = require('@pixelwelders/tlh-universe-data');
const wrapArray = require('../../utils/wrapArray');
const xp = require('../../utils/xp');
const ordinal = require('../../utils/ordinal');
const { getBar, fullSquare, emptySquare, fullPoint, emptyPoint } = require('../../utils/getBar');
const getCharacterEmbed = require('../../utils/getCharacterEmbed');

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

const getUtilButtons = (interaction, { character }) => {
  const actionRow = new MessageActionRow();

  const buttons = [
    new MessageButton()
      .setCustomId('setAvatar')
      .setLabel(`Set Avatar Image`)
      .setStyle('SECONDARY')
  ];

  if (character.image) {
    buttons.push(
      new MessageButton()
      .setCustomId('deleteAvatar')
      .setLabel(`Delete Avatar Image`)
      .setStyle('DANGER')
    );
  }

  buttons.push(
    new MessageButton()
      .setCustomId('applyPoints')
      .setLabel(`Apply ${character.statPoints} Points`)
      .setStyle('PRIMARY')
      .setDisabled(character.statPoints === 0)
  )

  return buttons.length ? [actionRow.addComponents(...buttons)] : [];
};

const getStatButtons = (interaction, { character, statChanges } = {}) => {
  // Turn stats into MessageActionRows with five MessageButtons each.
  const stats2D = wrapArray(character.stats, 5);
  const components = stats2D.map((row, rowIndex) => {
    const actionRow = new MessageActionRow();
    row.forEach((stat, colIndex) => {
      const statIndex = rowIndex * 5 + colIndex;
      const button = new MessageButton()
        .setCustomId(stat.displayName.toLowerCase())
        .setLabel(`+ ${stat.displayName}`)
        .setStyle('SECONDARY')
        .setDisabled(stat.value + statChanges[statIndex] >= stat.max);

      actionRow.addComponents(button);
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

let timeout;
const time = 30 * 1000;
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
  const showControls = ephemeral; // Only show controls if this is private.

  // Get the character if we don't have it.
  let character = _character;
  if (!_character) {
    // Get the character and bail early if we don't have one.
    const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.member.id).get();
    if (characterDocs.empty) {
      return interaction.editReply(`You don't have a character yet. Use \`/character create\` to create one.`);
    }

    character = characterDocs.docs[0].data();
  }

  const embed = getCharacterEmbed(interaction.user, { character, statChanges });

  // Get buttons based on state.
  let components = [];
  if (showControls) {
    const getComponents = {
      [CharacterEmbedModes.NORMAL]: getUtilButtons,
      [CharacterEmbedModes.EDIT_STATS]: getStatButtons
    }[mode];
    components = getComponents(interaction, { character, statChanges });
  }

  // Send the embed.
  const message = await interaction.editReply({ embeds: [embed], components });

  // ------------------------------- HANDLERS ------------------------------------
  // Now listen for button presses.
  const filterButtons = i => i.user.id === interaction.member.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter: filterButtons, time });
  
  clearInterval(timeout);
  timeout = setTimeout(async () => {
    // await interaction.editReply({ content: `_Expired_`, components: [], embeds: [] });
  }, time);

  collector.on('collect', async i => {
    const { customId } = i.component;
    collector.stop();

    const newState = { ...state, ephemeral, mode, character, statChanges: [...statChanges] };
    let update = '';
    switch (customId) {
      case 'applyPoints':
        newState.mode = CharacterEmbedModes.EDIT_STATS;
        update = 'Applied all stats.';
        break;

      case 'applyPointsCancel':
        newState.mode = CharacterEmbedModes.NORMAL;
        newState.statChanges = [0, 0, 0, 0, 0, 0, 0];
        update = 'Cancelled.';
      break;

      case 'applyPointsReset':
        newState.statChanges = [0, 0, 0, 0, 0, 0, 0];
        update = 'Reset all points.';
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

        update = `${statsUsed} points applied.`;
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
        newState.statChanges[index] = Math.min(character.stats[index].max, newState.statChanges[index] + 1);
        update = `Added 1 point to ${customId}.`;
        break;

      case 'setAvatar':
        i.user.send('Hi! Please send me your new avatar as an attached image.');
        break;

      case 'deleteAvatar':
        console.log('deleting avatar');
        // Delete the user's avatar from firestore.
        await getFirestore().collection('discord_characters').doc(character.uid).update({ image: '' });
        newState.character.image = '';

        // TODO Delete it from firebase storage. Otherwise we'll get .png, .jpg, etc.
        // const storage = getStorage();
        // const bucket = storage.bucket();
        // const file = bucket.file(`images/discord/characters/${character.image}`);
        // await file.delete();
        update = 'Avatar deleted.';
        break;

      default:
        newState.mode = CharacterEmbedModes.NORMAL;
        break;
    }
    
    if (newState.mode !== mode) {
      // Blank the buttons to avoid a bug.
      await i.update({ content: `_${update}_`, components: [] });
    } else {
      await i.update({ content: `_${update}_` });
    }

    // Start it all over again.
    showCharacter(interaction, newState);
    // await i.update({ content: 'A button was clicked! ' + Math.random() });
  });

  collector.on('end', collected => {
    // console.log(`Collected ${collected.size} items`);
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription(`Do stuff with your character.`)
    // .addSubcommand(subcommand => subcommand
    //   .setName('create')
    //   .setDescription('Create your character (private).')
    // )
    .addSubcommand(subcommand => subcommand
      .setName('examine')
      .setDescription('Examine your character (private).')
    )
    .addSubcommand(subcommand => subcommand
      .setName('show')
      .setDescription('Show your character to the room (public).')
    )
    // .addSubcommand(subcommand => subcommand
    //   .setName('kill')
    //   .setDescription('Kill your character (private).')
    // )
    .addSubcommand(subcommand => subcommand
      .setName('clone')
      .setDescription('Kills your current character and creates a new one.')
    ),
    
  // TODO Don't use reply.
  async execute(interaction, character) {
    // This function takes a number and randomly divides it into the specified number of numbers.
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

        // We give the player 1 point for ever 0.1 rank.
        const userDoc = await getFirestore().collection('discord_users').doc(userUid).get();
        const user = userDoc.data();

        const userTier = xp.toTier(user.xp);
        const userGrowth = userTier - 1.8;
        // Add a point for every tenth of a tier they've gained.
        const defaultPoints = 10;
        const earnedPoints = Math.floor(userGrowth * 10);
        const statPoints = defaultPoints + earnedPoints;

        const character = new Character({
          uid: ref.id,
          displayName: interaction.user.username,
          player: interaction.user.id,
          statPoints
        });

        // Assign random stats.
        // const numPoints = character.statPoints;
        // const parts = split(statPoints, 7);
        // character.stats.forEach((stat, index) => { stat.value = parts[index]; });
        
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
      },
      'clone': async () => {
        await interaction.deferReply({ ephemeral: true });
        // Remove from firebase.
        // TODO This should get the one that the player object references.
        const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.user.id).get();
        if (characterDocs.empty) {
          console.log('Player did not have a character.');
        } else {
          await characterDocs.docs[0].ref.delete();
        }
        
        // Now create a new one.
        const userUid = interaction.member.id;
        const ref = getFirestore().collection('discord_characters').doc();

        // Create the character.
        // We give the player 1 point for ever 0.1 rank.
        const userDoc = await getFirestore().collection('discord_users').doc(userUid).get();
        const user = userDoc.data();

        const userTier = xp.toTier(user.xp);
        const userGrowth = userTier - 1.8;
        // Add a point for every tenth of a tier they've gained.
        const defaultPoints = 10;
        const earnedPoints = Math.floor(userGrowth * 10);
        const statPoints = defaultPoints + earnedPoints;

        const character = new Character({
          uid: ref.id,
          displayName: interaction.user.username,
          player: interaction.user.id,
          statPoints
        });

        // Assign random stats.
        // const numPoints = character.statPoints;
        // const parts = split(statPoints, 7);
        // character.stats.forEach((stat, index) => { stat.value = parts[index]; });
        
        // Save.
        await ref.set(character, { merge: true });

        // Save how many times the player has cloned.
        const numClones = (user.meta.numClones || 0) + 1;
        userDoc.ref.update({
          meta: { ...user.meta, numClones }
        });
        
        // Display.
        await showCharacter(interaction);

        // Message publicly.
        interaction.channel.send(`<@${interaction.user.id}> is dead. Everyone say hello to their ${ordinal(numClones)} clone, <@${interaction.user.id}>.`);
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