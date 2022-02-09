const { initializeApp, cert } = require('firebase-admin/app');
const serviceAccount = require('../__config__/firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  // credential: admin.credential.applicationDefault(),
  databaseURL: 'https://species-registry.firebaseio.com',
  storageBucket: 'species-registry.appspot.com'
});
