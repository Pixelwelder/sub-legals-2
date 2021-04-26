const admin = require('firebase-admin');
const newUser = require('../newUser');

require('../initFirebase');

const go = async () => {
  const userDocs = await admin.firestore().collection('discord_users').get();
  const promises = userDocs.docs.map((doc) => {
    const currentUser = doc.data();
    const updatedUser = newUser(currentUser);
    return doc.ref.update(updatedUser);
  });

  await Promise.all(promises);
  console.log(`${userDocs.size} users updated.`);
};

go();
