const { MessageEmbed } = require("discord.js");
const { getBar, fullPoint, emptyPoint } = require("./getBar");
const getStatFields = require('./getStatFields');

const getCharacterEmbed = (user, { character, statChanges = [0, 0, 0, 0, 0, 0, 0] } = {}) => {
  const showStats = true;
  const inline = false;

  // If the character has set an image URL, use it.
  const avatarUrl = character.image
    ? `http://storage.googleapis.com/species-registry.appspot.com/images/discord/characters/${character.image}`
    : user.avatarURL({ format: 'png', dynamic: true, size: 1024 });

  const embed = new MessageEmbed()
    .setColor('0x000000')
    .setTitle(character.displayName)
    .setImage(avatarUrl);

  if (showStats) {
    const fields = getStatFields(character.stats, statChanges);

    if (character.statPoints > 0) {
      // Add all stat changes
      const statsUsed = statChanges.reduce((acc, stat) => acc + stat);
      fields.push({
        name: 'Available points',
        value: getBar((character.statPoints || 0) - statsUsed, character.statPoints, fullPoint, emptyPoint),
        inline
      });
    }

    // fields.push({ name: 'Available points', value: getBar(character.statPoints, character.statPoints, point) });
    embed.setFields(fields);
  }

  return embed;
};

module.exports = getCharacterEmbed;
