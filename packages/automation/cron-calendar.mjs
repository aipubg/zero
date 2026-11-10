const aliases = {
  '@hourly': '0 * * * *', '@daily': '0 0 * * *', '@midnight': '0 0 * * *',
  '@weekly': '0 0 * * 0', '@monthly': '0 0 1 * *',
  '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *',
};
const months = Object.fromEntries('jan feb mar apr may jun jul aug sep oct nov dec'.split(' ').map((name, i) => [name, i + 1]));
const days = Object.fromEntries('sun mon tue wed thu fri sat'.split(' ').map((name, i) => [name, i]));

function field(raw, min, max, names = {}) {
  const text = raw.replace(/[a-z]+/g, name => names[name] ?? name);
  const values = new Set();
  for (const part of text.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) throw new Error(`Invalid cron field: ${raw}`);
    const base = match[1];
    const step = match[2] === undefined ? 1 : Number(match[2]);
    if (!Number.isSafeInteger(step) || step < 1 || (match[2] && base !== '*' && !base.includes('-'))) throw new Error(`Invalid cron step: ${raw}`);
    const [start, end] = base === '*' ? [min, max] : base.includes('-') ? base.split('-').map(Number) : [Number(base), Number(base)];
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < min || end > max || start > end) throw new Error(`Invalid cron range: ${raw}`);
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return { values, wildcard: text.includes('*') };
}

// Five calendar fields in the host process timezone, strictly after fromTime.
// Search is bounded to eight years; unsupported syntax never becomes an interval.
export function nextCronTime(expression, fromTime = Date.now()) {
  if (typeof expression !== 'string' || !Number.isFinite(fromTime) || !Number.isFinite(new Date(fromTime).getTime())) throw new Error('Invalid cron expression or starting timestamp');
  const text = expression.trim().toLowerCase();
  const parts = (aliases[text] || text).split(/\s+/);
  if (parts.length !== 5) throw new Error('Cron requires five calendar fields or a supported alias');
  const [minute, hour, dom, month, dow] = [field(parts[0], 0, 59), field(parts[1], 0, 23), field(parts[2], 1, 31), field(parts[3], 1, 12, months), field(parts[4], 0, 7, days)];
  if (dow.values.has(7)) dow.values.add(0);
  const horizon = new Date(fromTime); horizon.setFullYear(horizon.getFullYear() + 8);
  if (!Number.isFinite(horizon.getTime())) throw new Error('Cron starting timestamp exceeds supported calendar range');
  let candidate = Math.floor(fromTime / 60000) * 60000 + 60000;
  while (candidate <= horizon.getTime()) {
    const date = new Date(candidate);
    const domMatch = dom.values.has(date.getDate());
    const dowMatch = dow.values.has(date.getDay());
    const dayMatch = dom.wildcard || dow.wildcard ? domMatch && dowMatch : domMatch || dowMatch;
    if (!month.values.has(date.getMonth() + 1) || !dayMatch) {
      date.setDate(date.getDate() + 1); date.setHours(0, 0, 0, 0);
      candidate = date.getTime();
      continue;
    }
    if (hour.values.has(date.getHours()) && minute.values.has(date.getMinutes())) return candidate;
    candidate += 60000;
  }
  throw new Error('Cron has no matching calendar time within eight years');
}
