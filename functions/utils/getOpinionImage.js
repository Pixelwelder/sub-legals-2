module.exports = (opinion) => {
  const emojis = [ // 0-9
    '😡', '😠', '☹️', '🙁', '😕', '😐', '🙂', '😊', '🥰', '😍'
  ];

  const tlhEmojis = [
    '<:opinion00:836294294951165982>',
    '<:opinion01:836294381526450186>',
    '<:opinion03:836294422504276061>',
    '<:opinion04:836294422911123467>',
    '<:opinion05:836294422613983233>',
    '<:opinion06:836294422810722374>',
    '<:opinion07:836294422646882404>',
    '<:opinion08:836294422593273966>',
    '<:opinion09:836294422345023570>'
  ];
  return tlhEmojis[Math.floor(opinion)];
};
