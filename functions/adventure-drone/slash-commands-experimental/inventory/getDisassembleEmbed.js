const getItems = require('./getItems');
const store = require('../../store');
const { actions: inventoryActions, getSelectors } = require('../../store/inventory');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const oxfordComma = require('../../../utils/oxfordComma');

const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/inventory/icon';

const ButtonIds = {
  GIVE: 'give',
  CANCEL: 'cancel'
};

const getDisassembleEmbed = async (interaction) => {
  return { content: 'Disassembling...' };
};

module.exports = getDisassembleEmbed;