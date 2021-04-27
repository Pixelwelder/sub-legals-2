const admin = require('firebase-admin');
const sendHelp = require('../utils/sendHelp');
const newAchievement = require('../utils/newAchievement');
const hasAchievement = require('../utils/hasAchievement');

const adminId = '685513488411525164';
const awards = {
  'bug hunter': newAchievement({
    displayName: 'Bug Hunter',
    description: 'Found a bug in a Network Drone.'
  }),
  'idea factory': newAchievement({
    displayName: 'Idea Factory',
    description: 'Suggested an idea for a feature.'
  })
};

module.exports = {
  name: 'award',
  usage: 'award <user> --award <award name>',
  description: 'Award a user.',
  aliases: [],
  hide: true,
  execute: async function (message, options, userParams, yargParams) {
    if (message.author.id !== adminId) {
      message.react('❌');
      message.react('🔑');
    }

    const { user: userId, awardName } = yargParams;
    if (!userId || !awardName) return sendHelp(message, this);

    const award = awards[awardName.toLowerCase()];
    if (!award) {
      message.react('❌');
      message.react('🏆');
      return;
    }

    const userDoc = await admin.firestore().collection('discord_users').doc(userId).get();
    if (!userDoc.exists) {
      message.react('❌');
      message.react('👤');
      return;
    }

    const user = userDoc.data();
    if (hasAchievement(user, awardName)) {
      message.react('🏆');
      return;
    }

    user.achievements.push(award);
    await userDoc.ref.update(user);

    message.reply('✅');
  }
}
