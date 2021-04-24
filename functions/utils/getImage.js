const admin = require('firebase-admin');

const path = 'images/inventory/real-estate/planet';
const getImage = async (url = `${path}/default-planet@1x.jpg`) => {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(url);
    const signedUrls = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    return signedUrls[0];
  } catch (error) {
    console.error(error);
  }
};

module.exports = { getImage, path };
