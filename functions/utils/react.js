module.exports = (message, { isProfane = false } = {}) => {
  const messageStr = message.content.toLowerCase();

  if (messageStr.includes('mouth bone')) message.react('🦷');
  if (messageStr.includes('human')) message.react('<:human:821874570448601118>');
  if (messageStr.includes('observer')) message.react('⚠️');
  if (messageStr.includes('network')) message.react('♥');
  if (messageStr.includes('sarya')) message.react('835217625289064458');
  if (isProfane) message.react('😮');
};
