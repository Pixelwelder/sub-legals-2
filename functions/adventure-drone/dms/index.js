const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { v4: uuid } = require('uuid');
const { getClient } = require("../client");
const fetch = require('node-fetch');

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
      const characterDoc = characterDocs.docs[0];
      const character = characterDoc.data();
      // Delete the old image.
      if (character.image) {
        await getStorage().bucket().file(`images/discord/characters/${character.image}`).delete();
      }

      // Upload the new image to firebase storage.
      const token = uuid();
      const filename = `${character.uid}-${token}.${contentTypeToExtension(attachment.contentType)}`;
      console.log('filename', filename);
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(`images/discord/characters/${filename}`);

      const localFile = await fetch(attachment.url);
      const buffer = await localFile.buffer();
      await file.save(buffer, {
        metadata: {
          contentType: attachment.contentType,
          metadata: {
            firebaseStorageDownloadTokens: token
          }
        }
      });
      console.log('image uploaded');

      // Now add it to the character.
      await characterDoc.ref.update({ image: filename });
      console.log('firestore updated')

      message.reply('Alrighty, I\'ve updated your character\'s image. The next time you use `/character show` or `/character examine` you will see your new avatar.');
    }
  });
};

module.exports = { init };
