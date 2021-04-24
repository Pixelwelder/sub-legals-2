// const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Discord = require('discord.js');
const fs = require('fs');

const serviceAccount = require('./__config__/firebase-service-account.json');
const { botToken, prefix } = require('./__config__/discord.json');
const client = require('./client');
const getPoliteness = require('./utils/getPoliteness');
const getIsProfane = require('./utils/getIsProfane');
const react = require('./utils/react');

// const client = new Discord.Client();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // credential: admin.credential.applicationDefault(),
  databaseURL: 'https://species-registry.firebaseio.com',
  storageBucket: 'species-registry.appspot.com'
});

const isCommand = messageStr => messageStr.startsWith(prefix);
const executeCommand = (message, params) => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (client.commands.has(commandName)) {
    client.commands.get(commandName).execute(message, params, args);
  } else {
    client.commands.get('invalid').execute(message, params, args);
  }
};

// TODO ask for links
// TODO embeds for registry
// TODO complete library of emojis
// TODO too many human mentions
// TODO Announcements when species join or have revolutions.
// TODO Unlocks and accomplishments for streaks.

client.once('ready', () => {
  console.log(`${client.user.id} is ready`);
});

client.on('message', async (message) => {
  console.log('message', message.content);
  if (message.author.id === client.user.id) return;

  react(message);
  const isProfane = getIsProfane(message.content);
  let politeness = 0;

  // Ignore any non-commands.
  if (isCommand(message.content)) {
    politeness = getPoliteness(message.content)
    if (!isProfane && politeness < 0) message.react('❌');
    if (politeness > 0) message.react('❤');

    // const isMentioned = message.mentions.has(bot)
    // We have a genuine command.
    executeCommand(message, { politeness });
  }

  if (isProfane) message.react('😮');

  // Now record.
  let user = { opinion: 5 };
  const ref = admin.firestore().collection('discord_users').doc(message.author.id);
  const doc = await ref.get();
  if (doc.exists) {
    user = doc.data();
  }

  let delta = 0;
  if (politeness < 0) delta -= 1;
  if (politeness > 0) delta += 1;
  if (isProfane) delta -= 2;
  let newOpinion = user.opinion + delta;
  newOpinion = Math.max(0, newOpinion);
  newOpinion = Math.min(9, newOpinion);

  if (user.opinion !== newOpinion) {
    console.log(`opinion changed from ${user.opinion} to ${newOpinion} (${delta})`);
    await ref.set({
      ...user,
      opinion: newOpinion
    });
  }
});

client.login(botToken);
