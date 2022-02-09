const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { getClient } = require('../common/client'); //

const channelId = '839939394001174568';

const client = getClient();
// client.once('ready', () => {
//   const channel = client.channels.cache.get(adminChannelId);
//   channel.send('Inventory is listening.');
//   console.log('Inventory is listening.');
// });

const inventoryCreated = functions.firestore
  .document('discord_inventory/{inventoryId}')
  .onCreate(async (snapshot, context) => {
    console.log('inventory created');
  });

const inventoryUpdated = functions.firestore
  .document('discord_inventory/{inventoryId}')
  .onUpdate(async ({ before, after }, context) => {
    const data = after.data();
    console.log('');
    console.log('updated', data);

    const client = getClient();
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send(`${data.displayName} has changed appendages.`);
    }
  });

module.exports = {
  inventoryCreated,
  inventoryUpdated
};
