const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');

const root = process.env.OSS_REVIEW_ROOT;
if (!root) throw new Error('Set OSS_REVIEW_ROOT to your review workspace');
const ts = require(path.join(root, 'util/node_modules/typescript'));
const repo = path.join(root, 'util-review-817');
const base = '9f2ff96640a6ab760919a5b5b00fa5d4178c08f4';
const head = 'd78c21d59e46ba44288561bb78b46fdec226d81d';

function load(ref) {
  let warnings = 0;
  const source = cp.execFileSync('git', ['show', `${ref}:src/isEqual.ts`], { cwd: repo, encoding: 'utf8' });
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports,
    require: name => {
      assert.equal(name, './warning');
      return { __esModule: true, default: condition => { if (!condition) warnings += 1; } };
    },
  });
  return (a, b, shallow) => {
    warnings = 0;
    return { result: module.exports.default(a, b, shallow), warnings };
  };
}

const versions = { base: load(base), head: load(head) };
const observations = [];
function check(label, a, b, expected, warn = false, shallow = false) {
  for (const [version, compare] of Object.entries(versions)) {
    const actual = compare(a, b, shallow);
    observations.push({ label, version, expected, ...actual, pass: actual.result === expected && (warn ? actual.warnings > 0 : actual.warnings === 0) });
  }
}

for (let seed = 0; seed < 100; seed += 1) {
  for (let copies = 2; copies <= 5; copies += 1) {
    const shared = { value: seed, nested: [seed % 3, { text: `p${seed}` }] };
    for (const shape of ['object', 'array']) {
      const repeated = Array(copies).fill(shared);
      const a = shape === 'array' ? repeated : Object.fromEntries(repeated.map((p, i) => [`k${i}`, p]));
      const b = JSON.parse(JSON.stringify(a));
      check(`equal-${seed}-${copies}-${shape}`, a, b, true);
      check(`reverse-${seed}-${copies}-${shape}`, b, a, true);
      const changed = JSON.parse(JSON.stringify(a));
      changed[shape === 'array' ? copies - 1 : `k${copies - 1}`].value = seed + 1;
      check(`different-${seed}-${copies}-${shape}`, a, changed, false);
      check(`different-reverse-${seed}-${copies}-${shape}`, changed, a, false);
      check(`shallow-${seed}-${copies}-${shape}`, a, b, false, false, true);
      check(`identity-${seed}-${copies}-${shape}`, a, a, true, false, true);
    }
  }
}

for (let depth = 1; depth <= 20; depth += 1) {
  const a = {}, b = {};
  let ca = a, cb = b;
  for (let i = 0; i < depth; i += 1) { ca.next = {}; cb.next = {}; ca = ca.next; cb = cb.next; }
  ca.next = a; cb.next = b;
  check(`cycle-${depth}`, a, b, false, true);
  check(`cycle-reverse-${depth}`, b, a, false, true);
}

const summary = {
  base, head, comparisons_per_version: observations.length / 2,
  versions: Object.fromEntries(Object.keys(versions).map(version => [version, {
    passed: observations.filter(o => o.version === version && o.pass).length,
    failed: observations.filter(o => o.version === version && !o.pass).length,
  }])),
  failing_base_examples: observations.filter(o => o.version === 'base' && !o.pass).slice(0, 3),
};
fs.writeFileSync(path.join(__dirname, 'util-817-independent-probe.json'), JSON.stringify(summary, null, 2) + '\n');
assert.equal(summary.versions.head.failed, 0);
assert.ok(summary.versions.base.failed > 0);
console.log(JSON.stringify(summary, null, 2));
