// Usage: node dayjs-3244-probe.cjs BASE HEAD PREVIEW OUTPUT.json
// Requires the locked @babel/register dependency in HEAD/node_modules.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const [base, head, preview, output] = process.argv.slice(2).map(x => path.resolve(x));
require(path.join(head, 'node_modules/@babel/register'))({
  babelrc: false, configFile: false,
  presets: [[path.join(head, 'node_modules/@babel/preset-env'), { targets: { node: 'current' } }]],
  ignore: [/node_modules/], cache: false
});

function load(root, order, utc = false, witness = false) {
  const prefix = path.join(root, 'src') + path.sep;
  Object.keys(require.cache).filter(k => k.startsWith(prefix)).forEach(k => delete require.cache[k]);
  const dayjs = require(path.join(root, 'src')).default;
  if (utc) dayjs.extend(require(path.join(root, 'src/plugin/utc')).default);
  const captures = [];
  if (witness) dayjs.extend((_, C) => {
    C.prototype.add = function(value, unit) { captures.push({ value, unit }); return this; };
  });
  for (const name of order) dayjs.extend(require(path.join(root, 'src/plugin', name)).default);
  return { dayjs, captures };
}
const roots = { base, head, preview };
const orders = [['duration', 'quarterOfYear'], ['quarterOfYear', 'duration']];
const dates = [
  '2025-01-31T12:34:56.789', '2025-03-31T12:34:56.789',
  '2024-02-29T12:34:56.789', '2024-01-31T12:34:56.789',
  '2025-12-31T12:34:56.789', '2026-08-31T12:34:56.789',
  '2025-03-08T12:34:56.789', '2025-11-01T12:34:56.789',
  '2019-01-01T12:00:00.000Z', '2025-04-06T00:30:00',
  '2025-09-27T12:34:56.789', '2025-10-25T12:34:56.789'
];
const durations = [
  [{ months: 1 }], [{ months: -1 }], [{ years: 1 }], [{ years: -1 }],
  [{ days: 10 }], [{ days: -2 }], [{ hours: 24 }], [{ milliseconds: 1 }],
  [{ months: 1, days: 2, hours: 3, minutes: 4, seconds: 5, milliseconds: 6 }],
  [{ years: 1, months: 2, days: 3 }], ['P1M'], ['P1Y2M3DT4H5M6S'],
  [10, 'days'], [1, 'months'], [0]
];
const results = {};
for (const [name, root] of Object.entries(roots)) {
  const result = { duration_observations: 0, duration_mismatches: 0, samples: [], forwarding_checks: 0, forwarding_failures: 0 };
  for (const utc of [false, true]) {
    const oracle = load(root, ['duration'], utc).dayjs;
    for (const order of orders) {
      const d = load(root, order, utc).dayjs;
      for (const date of dates) for (const args of durations) for (const op of ['add', 'subtract']) {
        const initial = utc ? d.utc(date) : d(date);
        const before = initial.valueOf();
        const span = d.duration(...args);
        const spanBefore = span.toISOString();
        const actual = initial[op](span);
        const reference = (utc ? oracle.utc(date) : oracle(date))[op](oracle.duration(...args));
        result.duration_observations++;
        assert.strictEqual(initial.valueOf(), before, 'Date input mutated');
        assert.strictEqual(span.toISOString(), spanBefore, 'Duration input mutated');
        const same = Object.is(actual.valueOf(), reference.valueOf()) && actual.format('YYYY-MM-DDTHH:mm:ss.SSSZ') === reference.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        if (!same) {
          result.duration_mismatches++;
          if (result.samples.length < 6) result.samples.push({ order, utc, date, args, op, actual: actual.format(), expected: reference.format() });
        }
      }
    }
  }
  for (const unit of [undefined, 'day', 'month', 'year', 'millisecond']) {
    const { dayjs, captures } = load(root, ['quarterOfYear'], false, true);
    const value = { valueOf() { throw new Error('Premature argument coercion'); } };
    result.forwarding_checks++;
    try {
      dayjs('2025-01-31').add(value, unit);
      assert.strictEqual(captures.length, 1);
      assert.strictEqual(captures[0].value, value);
      assert.strictEqual(captures[0].unit, unit);
    } catch (_) { result.forwarding_failures++; }
  }
  results[name] = result;
}
let numericControls = 0;
for (const utc of [false, true]) for (const order of orders) {
  const instances = Object.fromEntries(Object.entries(roots).map(([k, r]) => [k, load(r, order, utc).dayjs]));
  for (const date of dates) for (const value of [0, 1, -1, '1', '-2', 1.5, null, undefined])
    for (const unit of ['Q', 'quarter', 'quarters', 'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'])
      for (const op of ['add', 'subtract']) {
        const actual = Object.fromEntries(Object.entries(instances).map(([k, d]) => {
          const before = utc ? d.utc(date) : d(date);
          const after = before[op](value, unit);
          return [k, [after.valueOf(), after.format('YYYY-MM-DDTHH:mm:ss.SSSZ')]];
        }));
        assert.deepStrictEqual(actual.head, actual.base, `Numeric control ${date}/${value}/${unit}/${op}`);
        assert.deepStrictEqual(actual.preview, actual.base);
        numericControls += 2;
      }
}
assert(results.base.duration_mismatches > 0, 'No regression reproduced');
assert.strictEqual(results.base.forwarding_failures, 5);
for (const name of ['head', 'preview']) {
  assert.strictEqual(results[name].duration_mismatches, 0);
  assert.strictEqual(results[name].forwarding_failures, 0);
}
const receipt = { checked_at_utc: new Date().toISOString(), timezone: process.env.TZ || 'system default', runtime: process.version,
  dates: dates.length, duration_inputs: durations.length, modes: ['local', 'UTC'], plugin_orders: orders,
  numeric_control_comparisons: numericControls, results,
  limits: 'Scoped duration/quarter and pass-through tests; no claim about every plugin combination or browser runtime.' };
fs.writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
