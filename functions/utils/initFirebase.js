const admin = require('firebase-admin');
const serviceAccount = require('../__config__/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // credential: admin.credential.applicationDefault(),
  databaseURL: 'https://species-registry.firebaseio.com',
  storageBucket: 'species-registry.appspot.com'
});
