module.exports = (message) => {
  const messageStr = message.content.toLowerCase();

  if (message.content.toLowerCase().includes('mouth bone')) message.react('🦷');
  if (message.content.toLowerCase().includes('human')) message.react('<:human:821874570448601118>');
  if (message.content.toLowerCase().includes('observer')) message.react('⚠️');
  if (message.content.toLowerCase().includes('sarya')) message.react('835217625289064458');
};
