const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Discord = require('discord.js');

const serviceAccount = require('./__config__/firebase-service-account.json');
const { botToken, prefix } = require('./__config__/discord.json');
const commands = require('./commands');

const client = new Discord.Client();

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   // credential: admin.credential.applicationDefault(),
//   databaseURL: 'https://species-registry.firebaseio.com',
// });

const validCommandNames = Object.keys(commands);
const isCommand = messageStr => messageStr.startsWith(prefix);
const isValidCommand = (messageStr) => {
  if (!isCommand(messageStr)) return false;
  return !!commands[messageStr.slice(1)];
}
const getCommand = messageStr => commands[messageStr.slice(1)];
const executeCommand = message => {
  console.log('executeCommand', commands);
  const command = getCommand(message.content);
  command(message);
};

client.once('ready', () => {
  console.log('ready');
});

client.on('message', async (message) => {
  console.log('message', message.content);
  // TODO Only ignore from THIS bot.
  if (message.author.bot) return;
  // Ignore any non-commands.
  if (!isCommand(message.content)) return;
  if (!isValidCommand(message.content)) {
    commands.invalid(message);
  }

  // We have a genuine command.
  executeCommand(message);

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
