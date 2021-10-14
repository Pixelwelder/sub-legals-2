const admin = require('firebase-admin');
const service_account = require('./__config__/firebase-service-account.json');
const minions = require('./adventure-drone/minions');
const { botToken, adminChannelId, adminGuildId } = require('./adventure-drone/settings');
const { getClient } = require('./adventure-drone/client');

const initFirebase = async () => {
  admin.initializeApp({
    credential: admin.credential.cert(service_account),
    // databaseURL: `https://${project_id}.firebaseio.com`,
    // storageBucket: `${project_id}.appspot.com`,
    // projectId: project_id
  });
};

const initDiscord = async () => {
  console.log('initDiscord');
  const client = getClient();
  client.once('ready', () => {
    const channel = client.channels.cache.get(adminChannelId);
    channel.send('Minions are listening.');
  });

  await client.login(botToken);
  console.log('initDiscord complete');
};

const go = async () => {
  await initFirebase();
  await initDiscord();
  console.log('ready');
};
go();

module.exports = {
  ...minions
};
