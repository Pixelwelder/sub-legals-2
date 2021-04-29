const admin = require('firebase-admin');
const newUser = require('./newUser');
const fixUser = require('./fixUser');

module.exports = async (id) => {
  const userRef = admin.firestore().collection('discord_users').doc(id);
  const userDoc = await userRef.get();
  const user = userDoc.exists ? userDoc.data() : newUser();
  fixUser(user);

  return { userDoc, user };
};
