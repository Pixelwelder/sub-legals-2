// const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Discord = require('discord.js');
const fs = require('fs');
const yargs = require('yargs');
const { botToken, prefix } = require('./__config__/discord.json');
const client = require('./client');
const getPoliteness = require('./utils/getPoliteness');
const getIsProfane = require('./utils/getIsProfane');
const react = require('./utils/react');

require('./utils/initFirebase');

const isCommand = messageStr => messageStr.startsWith(prefix);
const executeCommand = (message, params) => {
  // TODO Reduce this to a single object.
  const obj = yargs.parse(message.content);
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();//.replace(/[^\w\s]/gi, '');

  if (client.commands.has(commandName)) {
    client.commands.get(commandName).execute(message, params, args, obj);
  } else {
    client.commands.get('invalid').execute(message, params, args, obj);
  }
};

// TODO ask for links
// TODO complete library of emojis
// TODO too many human mentions
// TODO Announcements when species join or have revolutions.
// TODO Unlocks and accomplishments for streaks.
// TODO Migrate to twitter.
// TODO newUser
// TODO Achievement: all streaks in one day
// TODO Change streak name.
// TODO Give achievements via a command (from me).
// TODO Admin request channel.
// TODO New members must prove they're not Human.
client.once('ready', () => {
  console.log(`${client.user.id} is ready`);
});

client.on('message', async (message) => {
  console.log(message.author.id, ':', message.content);
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
