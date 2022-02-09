const admin = require('firebase-admin');
const service_account = require('./__config__/firebase-service-account.json');
const { botToken, adminChannelId, adminGuildId } = require('./adventure-drone/settings');
const { getClient } = require('./listeners/common/client');
const { admin_reports_v1 } = require('googleapis');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  // databaseURL: `https://${project_id}.firebaseio.com`,
  // storageBucket: `${project_id}.appspot.com`,
  // projectId: project_id
});

const client = getClient();
client.once('ready', () => {
  const channel = client.channels.cache.get(adminChannelId);
  channel.send('Listeners are listening...');
  console.log('\nListeners are listening.');
});

client.login(botToken);

module.exports = {
  ...require('./listeners')
};
