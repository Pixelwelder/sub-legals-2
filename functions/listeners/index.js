const admin = require('firebase-admin');
const service_account = require('../__config__/firebase-service-account.json');

// const minions = require('./minions');
// const inventory = require('./inventory');

const { botToken, adminChannelId, adminGuildId } = require('../adventure-drone/settings');
const { getClient } = require('./common/client');

let firebaseInitialized = false;
const initFirebase = async () => {
  if (!firebaseInitialized) {
    firebaseInitialized = true;
    admin.initializeApp({
      credential: admin.credential.cert(service_account),
      // databaseURL: `https://${project_id}.firebaseio.com`,
      // storageBucket: `${project_id}.appspot.com`,
      // projectId: project_id
    });
  }
};

let discordInitialized = false;
const initDiscord = async () => {
  if (!discordInitialized) {
    discordInitialized = true;
    const client = getClient();
    client.once('ready', () => {
      const channel = client.channels.cache.get(adminChannelId);
      channel.send('Listeners are listening...');
      console.log('Listeners are listening.');
    });
  
    await client.login(botToken);
  }
};

const go = async () => {
  await initFirebase();
  await initDiscord();
};
go();

module.exports = {
  // ...minions,
  ...require('./inventory')
};
