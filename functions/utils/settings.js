const admin = require('firebase-admin');

const newSettings = overrides => ({
  adminChannelId: '',
  botChannelId: '',
  testChannelId: '',
  ...overrides
});

let settings;
const initialize = async () => {
  console.log('initializing settings');
  const ref = admin.firestore().collection('discord_meta').doc('settings');
  const settingsDoc = await ref.get();
  if (!settingsDoc.exists) {
    settings = newSettings({
      adminChannelId: '839937418744168448',
      botChannelId: '839939394001174568',
      testChannelId: '839939394001174568'
    });
    await ref.set(settings);
  } else {
    settings = settingsDoc.data();
  }
  console.log('settings initialized');
};

const getSettings = () => {
  return settings;
};

module.exports = {
  initialize,
  getSettings
};
