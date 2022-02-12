const { getFirestore } = require('firebase-admin/firestore');

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

  const embed = getCharacterEmbed(interaction, { character, statChanges });

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

module.exports = { showCharacter };
