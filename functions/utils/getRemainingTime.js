const { DateTime, Duration, Interval } = require('luxon');

module.exports = (last, limit = 24, message = 'Broken') => {
  const lastDate = DateTime.fromISO(last);
  const nowDate = DateTime.now();
  const diff = nowDate.diff(lastDate, 'hours');

  const limitDuration = Duration.fromObject({ hours: limit });
  const isGood = diff.hours < limitDuration.hours;
  const str = isGood ? `${diff.toFormat('hh:mm:ss')} to check in` : message;
  return str;
  console.log('str', str);
  // console.log(str);

  const remaining = limitDuration.minus(diff);
  return remaining;
};
