// const functions = require("firebase-functions");
const admin = require('firebase-admin');
const Discord = require('discord.js');
const fs = require('fs');
const yargs = require('yargs');
const { botToken, prefix, adminId } = require('./settings');
const client = require('./client');
const getPoliteness = require('./utils/getPoliteness');
const getIsProfane = require('./utils/getIsProfane');
const react = require('./utils/react');
const rank = require('./utils/rank');
const settings = require('./utils/settings');
const isCommand = require('./utils/isCommand');
const channels = require('./utils/channels');

require('./utils/initFirebase');

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

// messageUpdate
const onMessage = async (message, type) => {
  console.log(message.author.id, ':', message.content, type);
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
  // TODO Move.
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

  if (type === 'message') rank.update(message)
};

const initDiscord = () => {
  client.once('ready', () => {
    const message = `${client.user.id} is ready`;
    const adminChannel = channels.getAdminChannel();
    adminChannel.send(message);
    console.log(message);
  });

  client.on('message', (message) => {
    onMessage(message, 'message');
  });

  client.on('messageUpdate', (oldMessage, newMessage) => {
    onMessage(newMessage, 'messageUpdate');
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Could not fetch message', error);
        return;
      }
    }
    // <:scanbotInspect:821873187947675688>
    console.log(user.id, );
    if (user.id === adminId && reaction.emoji.name === 'scanbotInspect') {
      reaction.message.channel.send(`The Network appreciates your contribution, <@${reaction.message.author.id}>.`);
      rank.update(reaction.message, 1000);
    }
    // console.log(reaction.message.content, reaction.message.author, reaction.emoji);
  });

  client.login(botToken);
}

const initialize = async () => {
  await settings.initialize();
  await rank.initialize();
  channels.initialize(client);
  initDiscord();
};

initialize();

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
// TODO Changing a streak's name to a deleted streak's name and then undeleting hidden streak gives two streaks

