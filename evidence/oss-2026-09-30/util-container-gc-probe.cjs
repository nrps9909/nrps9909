const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');

const root = process.env.OSS_REVIEW_ROOT;
if (!root) throw new Error('Set OSS_REVIEW_ROOT to your review workspace');
const ts = require(path.join(root, 'util/node_modules/typescript'));
const pnpmRoot = path.join(root, 'util/node_modules/.pnpm');
const jsdomDir = fs.readdirSync(pnpmRoot).find(p => p.startsWith('jsdom@'));
const { JSDOM } = require(path.join(pnpmRoot, jsdomDir, 'node_modules/jsdom'));
assert.equal(typeof global.gc, 'function', 'Run with node --expose-gc');

function load(ref) {
  const source = cp.execFileSync('git', ['show', `${ref}:src/Dom/dynamicCSS.ts`], {
    cwd: path.join(root, 'util-review-818'), encoding: 'utf8',
  });
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, document: dom.window.document,
    require: name => ({ __esModule: true, default: name === './canUseDom'
      ? () => true : (a, b) => a.contains(b) }),
  });
  return { api: module.exports, document: dom.window.document };
}

function createDetached(api, document, count) {
  const refs = [];
  for (let i = 0; i < count; i += 1) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    api.updateCSS('.demo { color: red; }', `cycle-${i}`, { attachTo: shadow });
    host.remove();
    refs.push(new WeakRef(shadow));
  }
  return refs;
}

async function collect() {
  // Avoid WeakRef dereferences while collecting; a dereference pins its target until the next job.
  for (let i = 0; i < 12; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

(async () => {
  const result = { runtime: process.version, environment: 'Node/V8 with JSDOM, not a Chromium heap measurement', rounds: [] };
  for (let round = 0; round < 3; round += 1) {
    const row = { round: round + 1 };
    for (const [version, ref] of Object.entries({ base: '389c5713d789c631b3e654b69ab282575579f05c', head: '0c56c0ab024f3f566eb1f9981b474431dd9ed759' })) {
      const { api, document } = load(ref);
      const refs = createDetached(api, document, 30);
      await collect();
      row[version] = { containers: 30, retained_after_gc: refs.filter(r => r.deref()).length };
      api.clearContainerCache();
      await collect();
      row[version].retained_after_cache_reset = refs.filter(r => r.deref()).length;
    }
    result.rounds.push(row);
  }
  fs.writeFileSync(path.join(__dirname, 'util-818-gc-probe.json'), JSON.stringify(result, null, 2) + '\n');
  assert.ok(result.rounds.every(r => r.base.retained_after_gc === 30));
  assert.ok(result.rounds.every(r => r.head.retained_after_gc === 0));
  assert.ok(result.rounds.every(r => r.base.retained_after_cache_reset === 0 && r.head.retained_after_cache_reset === 0));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
