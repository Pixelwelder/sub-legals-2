const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { getClient } = require('../client');

const channelId = '839939394001174568';

const minion_onCreated = functions.firestore
  .document('discord_minions/{minionId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    console.log('New minion:', data.displayName);
    const client = getClient();
    console.log(client.channels.cache);
    const adminChannel = client.channels.cache.get('839939394001174568');
    console.log('adminChannel', adminChannel);
    const channel = client.channels.fetch(channelId);
    console.log('channel', channel.id);
    if (channel) {
      channel.send(`A new minion is available. ${data.displayName} says hello.`);
    }
    console.log('complete');
  });

module.exports = {
  minion_onCreated
};
