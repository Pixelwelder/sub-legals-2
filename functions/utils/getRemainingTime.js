const { DateTime, Duration } = require('luxon');

module.exports = (last, limit = 24) => {
  const lastDate = DateTime.fromISO(last);
  const nowDate = DateTime.now();
  const diff = nowDate.diff(lastDate);
  const day = Duration.fromObject({ hours: limit });
  const remaining = day.minus(diff);
  return remaining;
};
