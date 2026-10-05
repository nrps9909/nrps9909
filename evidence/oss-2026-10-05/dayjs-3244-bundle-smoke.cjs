const path = require('path');
const fs = require('fs');
const assert = require('assert');
const [root, output] = process.argv.slice(2);
const records = [];
const rows = [
  ['2025-01-31', 'add', { months: 1 }, '2025-02-28'],
  ['2025-03-31', 'subtract', { months: 1 }, '2025-02-28'],
  ['2024-02-29', 'add', { years: 1 }, '2025-02-28'],
  ['2024-01-31', 'add', { years: 1 }, '2025-01-31']
];
for (const order of [['duration', 'quarterOfYear'], ['quarterOfYear', 'duration']]) {
  for (const k of Object.keys(require.cache)) if (k.startsWith(path.resolve(root) + path.sep)) delete require.cache[k];
  const d = require(path.resolve(root, 'dayjs.min.js'));
  for (const name of order) d.extend(require(path.resolve(root, 'plugin', name + '.js')));
  for (const [date, op, args, expected] of rows) {
    const actual = d(date)[op](d.duration(args)).format('YYYY-MM-DD');
    assert.strictEqual(actual, expected);
    records.push({ order, date, op, args, actual });
  }
  assert.strictEqual(d('2025-01-31').add('1', 'quarter').format('YYYY-MM-DD'), '2025-04-30');
  assert.strictEqual(d('2025-01-31').subtract('1', 'quarter').format('YYYY-MM-DD'), '2024-10-31');
}
fs.writeFileSync(output, JSON.stringify({ checked_at_utc: new Date().toISOString(), timezone: process.env.TZ, records, numeric_string_quarter_checks: 4 }, null, 2) + '\n');
console.log('8 duration and 4 numeric quarter packaged UMD/CommonJS checks pass');
