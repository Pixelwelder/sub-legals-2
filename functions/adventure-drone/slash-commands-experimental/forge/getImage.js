const imageRoot = 'http://storage.googleapis.com/species-registry.appspot.com/images/discord/ui';
const getImage = ({ dialogId = 0 } = {}) => {
  return `${imageRoot}/nanoforge.jpg`;
};

module.exports = getImage;
