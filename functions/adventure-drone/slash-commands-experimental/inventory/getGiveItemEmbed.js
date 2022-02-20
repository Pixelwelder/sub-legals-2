const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { capitalize } = require('@pixelwelders/tlh-universe-util');
const getStatFields = require('../../../utils/getStatFields');
const getStatModifiers = require('../../../utils/getStatModifiers');
const ItemTypes = require('../../data/ItemTypes');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const ButtonIds = {
  GIVE: 'give',
  CANCEL: 'cancel'
};

const getGiveItemEmbed = async (interaction) => {
  const userId = interaction.member.id;
  const { data: { searchString = '', resident, ephemeral } } = getSelectors(userId).selectThread(store.getState());
  const items = getItems({ userId, searchString });

  if (items.length === 0) {
    return { content: `You don't have an item called "${searchString}".`};
  } else if (items.length > 1) {
    return {
      content: `Can you be more specific or use a number? That could describe ${oxfordComma(result.map(({ item }) => `**${item.displayName}**`), 'or')}.`
    };
  }

  // Now find the user.
  const guildMember = await interaction.guild.members.fetch(resident);
  if (!guildMember) return { content: `Couldn't find that user.`, embeds: [], components: [] };
  if (guildMember.user.id === userId) return { content: `You can't give yourself items.`, embeds: [], components: [] };

  const [item] = items;
  const { displayName } = item;

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(`GIVE ${displayName.toUpperCase()}`)
    .setDescription(`Are you sure you want to give ${displayName} to ${guildMember.user.username}?`)
    .setImage(`${imageRoot}/${item.image}`);

  const actionRow = new MessageActionRow();
  actionRow.addComponents(
    new MessageButton()
      .setCustomId(ButtonIds.GIVE)
      .setLabel('Give')
      .setStyle('DANGER'),

    new MessageButton()
      .setCustomId(ButtonIds.CANCEL)
      .setLabel('Cancel')
      .setStyle('SECONDARY')
  );

  // ---------------------------------------------------- HANDLERS ----------------------------------------------------
  const filter = i => i.user.id === userId;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30 * 1000 });
  collector.on('collect', async i => {
    // Stop collecting.
    collector.stop('manual');

    // Grab ID, then blank buttons to avoid bug.
    const { customId } = i.component;
    await i.update({ components: [] });
    
    console.log('button', customId);
    switch (customId) {
      case ButtonIds.GIVE:
        interaction.editReply({
          content: `You gave ${item.displayName} to ${guildMember.user.username}.`,
          embeds: [],
          components: []
        });
        break;

      case ButtonIds.CANCEL:
        interaction.editReply({
          content: `You decided not to give ${item.displayName} to ${guildMember.user.username}.`,
          embeds: [],
          components: []
        });
        break;

      default:
        // TODO Fail back up the chain? Or at least do the same thing everywhere.
        return { content: `Unknown button ${customId}.`, embeds: [], components: [] };
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
      // Out of time. Clear the response.
      await interaction.editReply({ embeds: [], components: [], content: 'Ran out of time.' });
    }
  });

  return { embeds: [embed], components: [actionRow] };
};

module.exports = getGiveItemEmbed;
