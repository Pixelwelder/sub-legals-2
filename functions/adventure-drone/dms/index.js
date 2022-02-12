const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { v4: uuid } = require('uuid');
const { getClient } = require("../client");

const contentTypeToExtension = (contentType) => {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    default:
      return '';
  }
}

const init = async () => {
  const client = getClient();

  client.on('messageCreate', async (message) => {
    console.log(`${message.author.username}: ${message.content}`);
    // Make sure the message is not from the bot.
    if (message.author.id === client.user.id) return;

    // Find out if the message is a DM
    if (message.channel.type.toLowerCase() === 'dm') {
      // Get the first attachment.
      const attachments = Array.from(message.attachments);
      if (!attachments.length) {
        return message.reply('If you are trying to update your character\'s image, please attach an image file.');
      }


      const attachment = attachments[0][1];
      console.log(message.author.id);
      console.log(attachment);

      // Get the user's character from firestore.
      // TODO Will need to get this property from the user's profile.
      const characterDocs = await getFirestore().collection('discord_characters').where('player', '==', message.author.id).get();
      if (characterDocs.empty) {
        message.reply('You don\'t have a character. Please create one in a public channel channel.');
        return;
      }

      // TODO Resize. That'll be a job for a storage watcher.
      // Upload the attachment to firebase storage.
      // const { name: filename } = attachment;
      const filename = `${characterDocs.docs[0].id}.${contentTypeToExtension(attachment.contentType)}`;
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`images/discord/characters/${filename}`);

      // const localFile = await fetch(attachment.url);
      // const blob = await localFile.blob();
      // await file.upload(blob, {
      //   metadata: {
      //     contentType: attachment.contentType,
      //     metadata: {
      //       firebaseStorageDownloadTokens: uuid()
      //     }
      //   }
      // });
      // await bucket.upload(blob, { destination: `images/discord/characters/${filename}` });

      // await file.save(attachment.url, {
      //   contentType: attachment.contentType,
      //   metadata: {
      //     contentType: attachment.contentType,
      //     firebaseStorageDownloadTokens: uuid(),
      //   }
      // });
      console.log('image uploaded');

      // Now add it to the character.
      const characterDoc = characterDocs.docs[0];
      await characterDoc.ref.update({ image: filename });
      console.log('firestore updated')
    }
  });
};

module.exports = { init };
