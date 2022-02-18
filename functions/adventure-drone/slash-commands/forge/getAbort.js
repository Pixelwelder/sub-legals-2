const { getFirestore } = require('firebase-admin/firestore');

const getAbort = (userId, response = {}) => {
  getFirestore().collection('discord_ui').doc('crafting').collection('in-flight').doc(userId).delete();
  return { embeds: [], components: [], content: 'The Nanoforge has encountered a catastrophic error. Please try again.', ...response };
};

module.exports = getAbort;
