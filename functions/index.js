// const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Discord = require('discord.js');

const serviceAccount = require('./__config__/firebase-service-account.json');
const { botToken, prefix } = require('./__config__/discord.json');
const commands = require('./commands');
const getPoliteness = require('./utils/getPoliteness');
const getIsProfane = require('./utils/getIsProfane');
const react = require('./utils/react');

const client = new Discord.Client();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // credential: admin.credential.applicationDefault(),
  databaseURL: 'https://species-registry.firebaseio.com',
});

const isCommand = messageStr => messageStr.startsWith(prefix);
const getCommand = messageStr => {
  const commandStr = messageStr.slice(1).split(' ')[0];
  return commands[commandStr];
};
const isValidCommand = (messageStr) => {
  if (!isCommand(messageStr)) return false;
  return !!getCommand(messageStr);
}
const executeCommand = (message, params) => {
  const command = getCommand(message.content);
  command(message, params);
};

// TODO ask for links

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
    if (isValidCommand(message.content)) {
      executeCommand(message, { politeness });
    } else {
      commands.invalid(message);
    }
  }

  if (isProfane) message.react('❌');

  // Now record.

  console.log('recording', politeness);
  let user = { opinion: 5 };
  const ref = admin.firestore().collection('discord_users').doc(message.author.id);
  const doc = await ref.get();
  if (doc.exists) {
    console.log('exists');
    user = doc.data();
  }

  let delta = 0;
  if (politeness < 0) delta -= 1;
  if (politeness > 0) delta += 1;
  if (isProfane) delta -= 2;
  let newOpinion = user.opinion + delta;
  newOpinion = Math.max(0, newOpinion);
  newOpinion = Math.min(9, newOpinion);

  console.log(`opinion changed from ${user.opinion} to ${newOpinion} (${delta})`);
  if (user.opinion !== newOpinion) {
    await ref.set({
      ...user,
      opinion: newOpinion
    });
  }

  // console.log(message.content);
  // console.log(message.author);
});

client.login(botToken);

console.log('initialized');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
