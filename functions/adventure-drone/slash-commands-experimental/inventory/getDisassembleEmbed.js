const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const oxfordComma = require('../../../utils/oxfordComma');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const ButtonIds = {
  CONFIRM: 'confirm',
  CANCEL: 'cancel'
};

const getConfirmationEmbed = async (interaction, { item, title, description }) => {
  await interaction.editReply({ content: '_Expired_', components: [], embeds: [] });
  
  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(title)
    .setDescription(description)
    .setImage(`${imageRoot}/${item.image}`);

  const actionRow = new MessageActionRow();
  actionRow.addComponents(
    new MessageButton()
      .setCustomId(ButtonIds.CONFIRM)
      .setLabel('Confirm')
      .setStyle('DANGER'),

    new MessageButton()
      .setCustomId(ButtonIds.CANCEL)
      .setLabel('Cancel')
      .setStyle('SECONDARY')
  );

  // await interaction.followUp({ embeds: [embed], components: [actionRow] });
  // await new Promise(resolve => setTimeout(resolve, 5000));
  return { content: 'Disassembling...', components: [actionRow], embeds: [embed] };
};

const getDisassembleEmbed = async (interaction) => {
  const userId = interaction.member.id;
  const { data: { itemUid } } = getSelectors(userId).selectThread(store.getState());
  const inventory = getSelectors(userId).selectInventoryByUid(store.getState());
  const item = inventory[itemUid];

  console.log('item', itemUid, !!item);
  // console.log(inventory);
  if (!item) return { content: `You don't own that item.`, embeds: [], components: [] };

  const response = getConfirmationEmbed(interaction, {
    item,
    title: `DISASSEMBLE ${item.displayName.toUpperCase()}`,
    description: `Are you sure you want to disassemble ${item.displayName}?`
  });
  
  // const confirmation = getConfirmationEmbed(interaction, {
  //   item
  // });

  // const embed = new MessageEmbed()
  //   .setColor('0x000000')
  //   .setTitle(`GIVE ${displayName.toUpperCase()}`)
  //   .setDescription(`Are you sure you want to disassemble ${displayName}?`)
  //   .setImage(`${imageRoot}/${item.image}`);

  // const actionRow = new MessageActionRow();
  // actionRow.addComponents(
  //   new MessageButton()
  //     .setCustomId(ButtonIds.GIVE)
  //     .setLabel('Give')
  //     .setStyle('DANGER'),

  //   new MessageButton()
  //     .setCustomId(ButtonIds.CANCEL)
  //     .setLabel('Cancel')
  //     .setStyle('SECONDARY')
  // );

  return response;
};

module.exports = getDisassembleEmbed;