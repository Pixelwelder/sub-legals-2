const admin = require('firebase-admin');
const newUser = require('../utils/newUser');
const { TLHDiscordId } = require ('../constants');

require('../utils/initFirebase');

const updateToLatest = async () => {
  const userDocs = await admin.firestore().collection('discord_users').get();
  const promises = userDocs.docs.map((doc) => {
    const currentUser = doc.data();
    const updatedUser = newUser(currentUser);
    return doc.ref.update(updatedUser);
  });

  await Promise.all(promises);
  console.log(`${userDocs.size} users updated.`);
};

const move = async () => {
  const newDoc = admin.firestore().collection('discord_users').doc(TLHDiscordId);
  await newDoc.set({ id: TLHDiscordId });

  const userDocs = await admin.firestore().collection('discord_users').get();
  const promises = userDocs.docs.map((doc) => {
    const currentUser = doc.data();
    return newDoc.collection('users').doc(doc.id).set(currentUser);
  });

  await Promise.all(promises);
  console.log(`moved ${promises.length} users`);
};

updateToLatest();
