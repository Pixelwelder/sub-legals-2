const { DateTime, Duration, Interval } = require('luxon');

module.exports = (last, limit = 24, message = 'Broken') => {
  const lastDate = DateTime.fromISO(last);
  const nowDate = DateTime.now();
  const diff = nowDate.diff(lastDate, 'hours');

  const limitDuration = Duration.fromObject({ hours: limit });
  const isGood = diff.hours < limitDuration.hours;
  const remaining = limitDuration.minus(diff);
  const str = isGood ? `${remaining.toFormat('hh:mm:ss')} to check in` : message;
  return { str, remaining, isGood };
};
