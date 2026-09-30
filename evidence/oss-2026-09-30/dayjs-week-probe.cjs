const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

if (!process.env.OSS_REVIEW_ROOT) throw new Error('Set OSS_REVIEW_ROOT to your review workspace');
const repo = path.join(process.env.OSS_REVIEW_ROOT, 'dayjs-review-3240');
const deps = path.join(repo, 'node_modules');

if (process.argv[2] === 'worker') {
  const source = process.argv[3];
  require(path.join(deps, '@babel/register'))({
    babelrc: false, configFile: false,
    only: [/dayjs-week-review-/], ignore: [],
    presets: [[path.join(deps, '@babel/preset-env'), { targets: { node: 'current' } }]],
  });
  const dayjs = require(path.join(source, 'src')).default;
  for (const plugin of ['utc', 'weekOfYear', 'advancedFormat', 'customParseFormat']) {
    dayjs.extend(require(path.join(source, 'src/plugin', plugin)).default);
  }
  for (const locale of ['en-gb', 'zh-cn']) require(path.join(source, 'src/locale', locale));
  const moment = require(path.join(deps, 'moment'));
  for (const locale of ['en-gb', 'zh-cn']) require(path.join(deps, 'moment/locale', locale));

  const summary = { timezone: process.env.TZ, utc_cases: 0, utc_failed: 0, local_cases: 0, local_failed: 0, controls: [] };
  for (const locale of ['en', 'en-gb', 'zh-cn']) {
    dayjs.locale(locale);
    moment.locale(locale);
    for (let year = 2020; year <= 2029; year += 1) {
      for (let week = 1; week <= 52; week += 1) {
        for (const token of ['w', 'ww']) {
          const value = token === 'ww' ? String(week).padStart(2, '0') : String(week);
          const input = `${year}-w${value} 12:23:45`;
          const format = `YYYY-[w]${token} HH:mm:ss`;
          const outputFormat = 'YYYY-MM-DD HH:mm:ss';
          const parsed = dayjs.utc(input, format, locale);
          const expected = moment.utc([year, 0, 1, 12, 23, 45]).locale(locale).week(week);
          summary.utc_cases += 1;
          if (!parsed.isUTC() || parsed.utcOffset() !== 0 || parsed.format(outputFormat) !== expected.format(outputFormat)) summary.utc_failed += 1;
          const local = dayjs(input, format, locale);
          const expectedLocal = moment([year, 0, 1, 12, 23, 45]).locale(locale).week(week);
          summary.local_cases += 1;
          if (local.format(outputFormat) !== expectedLocal.format(outputFormat)) summary.local_failed += 1;
        }
      }
    }
    for (const [input, format] of [['2024-02-29 12:23:45', 'YYYY-MM-DD HH:mm:ss'], ['2024-03-10T05:00:00+02:00', 'YYYY-MM-DDTHH:mm:ssZ']]) {
      summary.controls.push({ locale, input, output: dayjs.utc(input, format, locale).toISOString() });
    }
  }
  console.log(JSON.stringify(summary));
  process.exit(0);
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dayjs-week-review-'));
try {
  const refs = { base: '436bde0bcded312781cbe45dc2b0ef079a36d8e3', head: 'dff2019fdbd77c50058a41c1e72fd6e49a1f41b3' };
  const sources = {};
  for (const [version, ref] of Object.entries(refs)) {
    const directory = path.join(scratch, version);
    fs.mkdirSync(directory);
    const archive = cp.execFileSync('git', ['archive', ref, 'src'], { cwd: repo });
    cp.execFileSync('tar', ['-x', '-C', directory], { input: archive });
    const alias = path.join(directory, 'node_modules/dayjs');
    fs.mkdirSync(alias, { recursive: true });
    fs.writeFileSync(path.join(alias, 'package.json'), JSON.stringify({ main: '../../src/index.js' }));
    sources[version] = directory;
  }
  const results = { refs, runtime: process.version, timezones: [] };
  for (const timezone of ['UTC', 'America/New_York', 'Europe/London', 'Pacific/Auckland']) {
    const row = { timezone };
    for (const version of ['base', 'head']) {
      row[version] = JSON.parse(cp.execFileSync(process.execPath, [__filename, 'worker', sources[version]], {
        env: { ...process.env, TZ: timezone, BABEL_DISABLE_CACHE: '1' }, encoding: 'utf8',
      }));
    }
    assert.equal(row.head.utc_failed, 0);
    assert.equal(row.head.local_failed, 0);
    assert.deepEqual(row.head.controls, row.base.controls);
    assert.ok(row.base.utc_failed > 0);
    results.timezones.push(row);
  }
  results.totals = {
    utc_comparisons_per_version: results.timezones.reduce((n, r) => n + r.head.utc_cases, 0),
    local_comparisons_per_version: results.timezones.reduce((n, r) => n + r.head.local_cases, 0),
    base_utc_failed: results.timezones.reduce((n, r) => n + r.base.utc_failed, 0),
    head_utc_failed: 0, head_local_failed: 0,
  };
  fs.writeFileSync(path.join(__dirname, 'dayjs-3240-independent-probe.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results.totals));
} finally {
  fs.rmSync(scratch, { recursive: true });
}
