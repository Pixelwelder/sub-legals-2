const { getSettings } = require('./settings');

let client;
const initialize = (_client) => {
  client = _client;
};

// TODO Clean this up.
let adminChannel;
const getAdminChannel = () => {
  if (!adminChannel) {
    const { adminChannelId } = getSettings();
    adminChannel = client.channels.cache.get(adminChannelId);
  }
  return adminChannel;
};

let botChannel;
const getBotChannel = () => {
  if (!botChannel) {
    const { botChannelId } = getSettings();
    botChannel = client.channels.cache.get(botChannelId);
  }
  return botChannel;
};

let testChannel;
const getTestChannel = () => {
  if (!testChannel) {
    const { testChannelId } = getSettings();
    testChannel = client.channels.cache.get(testChannelId);
  }
  return testChannel;
};

module.exports = {
  initialize,
  getAdminChannel,
  getBotChannel,
  getTestChannel
};
