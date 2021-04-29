const { DateTime, Duration, Interval } = require('luxon');

// There should be a grace period on any check-in, because we don't know the timezone.
module.exports = ({ last, limit = 24, grace = 12, message = 'Broken' }) => {
  const lastDate = DateTime.fromISO(last);
  const nowDate = DateTime.now();
  const diff = nowDate.diff(lastDate, 'hours');

  console.log(limit, grace, limit + grace);
  const limitDuration = Duration.fromObject({ hours: (limit + grace) });
  const isGood = diff.hours < limitDuration.hours;
  const remaining = limitDuration.minus(diff);
  const str = isGood ? `${remaining.toFormat('hh:mm:ss')} to check in` : message;
  return { str, remaining, isGood };
};
