const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { getFirestore } = require('firebase-admin/firestore');
const { Character } = require('@pixelwelders/tlh-universe-data');

// Create an array of emojis, one for each letter.
const emojis = [
  '🅰', '🅱', '🅲', '🅳', '🅴', '🅵', '🅶', '🅷', '🅸', '🅹', '🅺', '🅻', '🅼', '🅽', '🅾', '🅿', '🆀', '🆁', '🆂', '🆃', '🆄', '🆅', '🆆', '🆇', '🆈', '🆉'
];
// TODO Handle numbers above 26.
const numToLetter = (num) => String.fromCharCode(0x41 + num);
const letterToNum = (letter) => letter.toUpperCase().charCodeAt(0) - 0x41;
const numToLetterEmoji = (num) => emojis[Math.min(num, 25)];

const fullEmoji = '🟥';
const empty = '⬛';
const point = '🔴';
// Converts a number and a max to a bar made of emojis.
// The bar has max number of segments.
const getBar = (num, max, full = fullEmoji) => {
  return `${full.repeat(num)}${empty.repeat(max - num)}`;
};

const showCharacter = async (interaction, { ephemeral = true } = {}) => {
  const avatarUrl = interaction.user.avatarURL({ format: 'png', dynamic: true, size: 1024 });
  
  const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', interaction.member.id).get();
  if (characterDocs.empty) {
    return interaction.editReply(`You don't have a character yet. Use \`/character create\` to create one.`);
  }

  const character = characterDocs.docs[0].data();
  console.log(`found ${characterDocs.size} character`);

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(character.displayName)
    .setImage(avatarUrl);

  const fields = character.stats.map((stat, index) => {
    return {
      name: stat.displayName,
      value: getBar(stat.value, stat.max),
      inline: true
    };
  });

  // fields.push({ name: 'Available points', value: getBar(character.statPoints, character.statPoints, point) });
  embed.setFields(fields);

  const message = await interaction.editReply({ embeds: [embed] });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
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

      return parts;;
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
        

        // Wrap an array to a two-dimensional array with specified width.
        // const map = (array, length) => {
        //   const result = [];
        //   for (let i = 0; i < length; i++) {
        //     result.push(array.slice(i * length, (i + 1) * length));
        //   }
        //   return result;
        // };

        // const row = new MessageActionRow();
        // character.stats.forEach(stat => {
        //   row.addComponents(
        //     new MessageButton()
        //       .setCustomId(stat.displayName.toLowerCase())
        //       .setLabel(stat.displayName)
        //       .setStyle('SECONDARY'))
        // });

        // const components = [
        //   new MessageActionRow()
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('strength')
        //         .setLabel('Strength')
        //         .setStyle('SECONDARY'))
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('perception')
        //         .setLabel('Perception')
        //         .setStyle('SECONDARY'))
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('endurance')
        //         .setLabel('Endurance')
        //         .setStyle('SECONDARY'))
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('charisma')
        //         .setLabel('Charisma')
        //         .setStyle('SECONDARY'))
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('intelligence')
        //         .setLabel('Intelligence')
        //         .setStyle('SECONDARY')),
        //   new MessageActionRow()
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('agility')
        //         .setLabel('Agility')
        //         .setStyle('SECONDARY'))
        //     .addComponents(
        //       new MessageButton()
        //         .setCustomId('luck')
        //         .setLabel('Luck')
        //         .setStyle('SECONDARY'))
        // ];
        // const message = await interaction.editReply({ embeds: [embed], components });
        

        // Now add reactions.
        // await message.react('🅰');
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
          await interaction.editReply({ content: 'You killed your character :(' });
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