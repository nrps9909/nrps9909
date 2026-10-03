// AI-assisted follow-up compatibility/performance probe for markedjs/marked#4121.
// Usage: node marked-4121-probe.mjs BASE/lib/marked.esm.js HEAD/lib/marked.esm.js PREVIOUS/lib/marked.esm.js
// Build each checkout first. Neither implementation is modified by this probe.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const [basePath, headPath, previousPath] = process.argv.slice(2);
assert.ok(basePath && headPath && previousPath, 'Supply base, head, and previous ESM paths');
const base = await import(pathToFileURL(resolve(basePath)));
const head = await import(pathToFileURL(resolve(headPath)));
const previous = await import(pathToFileURL(resolve(previousPath)));
const startedAt = new Date().toISOString();
const sharedPromise = Promise.resolve();
const segments = [
  '# Heading *em*\n\n',
  'Paragraph **strong**, `code`, [link](https://example.com).\n\n',
  '| a | b |\n|---|---|\n| c | **d** |\n\n',
  '- outer\n  - inner *text*\n- second\n\n',
  '> quoted\n>\n> - first\n> - second\n\n',
  '```js\nconst x = 1;\n```\n\n',
  '~~strike~~ <span>html</span> &amp; ![alt](image.png)\n\n',
  '1. first\n2. second\n\n---\n\n',
];
let state = 0x4121;
function next() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state >>> 8;
}
const documents = Array.from({ length: 512 }, () => {
  let markdown = '';
  const count = 1 + next() % 8;
  for (let i = 0; i < count; i++) markdown += segments[next() % segments.length];
  return markdown;
});
const digest = createHash('sha256').update(JSON.stringify(documents)).digest('hex');
let documentConfigurations = 0;
let denseResultComparisons = 0;
let visitedTokenComparisons = 0;
for (const options of [
  { gfm: true }, { gfm: false }, { gfm: true, pedantic: true }, { gfm: false, pedantic: true },
]) {
  for (const markdown of documents) {
    const before = new base.Marked(options);
    const after = new head.Marked(options);
    assert.equal(after.parse(markdown), before.parse(markdown));
    const beforeTokens = before.lexer(markdown);
    const afterTokens = after.lexer(markdown);
    for (const mode of ['undefined', 'promise', 'dense-array', 'one-level-runtime-array']) {
      function collect(seen) {
        return function(token) {
          seen.push([token.type, token.raw]);
          assert.ok(this === before || this === after);
          if (mode === 'undefined') return undefined;
          if (mode === 'promise') return sharedPromise;
          if (mode === 'dense-array') return [undefined, sharedPromise];
          // As in the PR's runtime tests, verify only one level is flattened.
          // This nested-array mode is broader than the public TS return type.
          return [sharedPromise, [undefined]];
        };
      }
      const beforeSeen = [];
      const afterSeen = [];
      const beforeValues = before.walkTokens(beforeTokens, collect(beforeSeen));
      const afterValues = after.walkTokens(afterTokens, collect(afterSeen));
      assert.deepEqual(afterSeen, beforeSeen);
      assert.deepEqual(afterValues, beforeValues);
      visitedTokenComparisons += beforeSeen.length;
      denseResultComparisons++;
    }
    const beforeHook = new base.Marked(options, { walkTokens() {} });
    const afterHook = new head.Marked(options, { walkTokens() {} });
    assert.equal(afterHook.parse(markdown), beforeHook.parse(markdown));
    assert.equal(afterHook.parse(markdown), before.parse(markdown));
    documentConfigurations++;
  }
}

const extensionResults = {};
for (const [name, module] of [['base', base], ['head', head]]) {
  const calls = [];
  const instance = new module.Marked(
    { walkTokens(token) { calls.push(['first', token.type]); return undefined; } },
    { walkTokens(token) { calls.push(['second', token.type]); return sharedPromise; } },
  );
  const values = instance.walkTokens(instance.lexer('*em*'), instance.defaults.walkTokens);
  extensionResults[name] = { calls, values };
}
assert.deepEqual(extensionResults.head, extensionResults.base);

const largeArrayResults = {};
for (const [name, module] of [['base', base], ['head', head]]) {
  const values = new module.Marked().walkTokens(
    [{ type: 'space', raw: '\n' }], () => Array(200000).fill(undefined),
  );
  assert.equal(values.length, 200000);
  assert.equal(Object.keys(values).length, 200000);
  largeArrayResults[name] = { length: values.length, completed: true };
}

const asyncResults = {};
for (const [name, module] of [['base', base], ['head', head]]) {
  const instance = new module.Marked();
  const tokens = instance.lexer('| a | b |\n|---|---|\n| c | d |\n\n- e\n  - *f*\n\n> g\n');
  let completed = 0;
  await Promise.all(instance.walkTokens(tokens, token => [
    new Promise(resolve => setTimeout(() => {
      if (token.type === 'text' && !token.tokens) token.text = token.text.toUpperCase();
      completed++;
      resolve();
    }, 1)),
    Promise.resolve(),
  ]));
  asyncResults[name] = { completed, html: instance.parser(tokens) };
}
assert.deepEqual(asyncResults.head, asyncResults.base);

// concat preserves holes and does not use an array's custom iterator.
// Record these compatibility edges separately from supported dense cases.
const arrayEdges = {};
for (const [name, module] of [['base', base], ['head', head]]) {
  const instance = new module.Marked();
  const sparse = instance.walkTokens([{ type: 'space', raw: '\n' }], () => Array(2));
  const custom = [sharedPromise];
  custom[Symbol.iterator] = function*() {};
  const customValues = instance.walkTokens([{ type: 'space', raw: '\n' }], () => custom);
  arrayEdges[name] = {
    sparse: { length: sparse.length, ownIndices: Object.keys(sparse) },
    customIterator: { length: customValues.length, includesPromise: customValues.includes(sharedPromise) },
  };
  const tokens = instance.lexer('before');
  const pending = new Promise(resolve => setTimeout(() => {
    tokens[0].tokens[0].text = 'after';
    resolve();
  }, 5));
  const promises = [pending];
  Object.defineProperty(promises, Symbol.iterator, { value: function*() {} });
  await Promise.all(instance.walkTokens(tokens, token => token.type === 'paragraph' ? promises : undefined));
  arrayEdges[name].customIterator.htmlAfterAwaitingWalkTokens = instance.parser(tokens);
  await pending;
}
assert.deepEqual(arrayEdges.base.sparse, { length: 2, ownIndices: [] });
assert.deepEqual(arrayEdges.head.sparse, { length: 2, ownIndices: ['0', '1'] });
assert.equal(arrayEdges.base.customIterator.includesPromise, true);
assert.equal(arrayEdges.head.customIterator.includesPromise, true);
assert.equal(arrayEdges.base.customIterator.htmlAfterAwaitingWalkTokens, '<p>after</p>\n');
assert.equal(arrayEdges.head.customIterator.htmlAfterAwaitingWalkTokens, '<p>after</p>\n');

// Five non-default callback-array iterators must not affect indexed collection.
const iteratorCases = ['empty', 'reversed', 'filtered', 'throws', 'non-callable'];
const iteratorComparisons = [];
for (const variant of iteratorCases) {
  const promises = [Promise.resolve(), Promise.resolve(), Promise.resolve()];
  const factories = {
    empty: function*() {},
    reversed: function*() { yield promises[2]; yield promises[1]; yield promises[0]; },
    filtered: function*() { yield promises[0]; },
    throws: function*() { throw new Error('iterator must not be used'); },
    'non-callable': null,
  };
  Object.defineProperty(promises, Symbol.iterator, { value: factories[variant] });
  const row = { variant };
  for (const [name, module] of [['base', base], ['previous', previous], ['head', head]]) {
    try {
      const values = new module.Marked().walkTokens([{ type: 'space', raw: '\n' }], () => promises);
      row[name] = { length: values.length, indexedValuesMatch: values.length === 3 && values.every((p, i) => p === promises[i]) };
    } catch (error) {
      row[name] = { error: error.message, indexedValuesMatch: false };
    }
  }
  assert.equal(row.base.indexedValuesMatch, true);
  assert.equal(row.head.indexedValuesMatch, true);
  assert.equal(row.previous.indexedValuesMatch, false);
  iteratorComparisons.push(row);
}
const sparsePromiseAll = {};
for (const [name, module] of [['base', base], ['previous', previous], ['head', head]]) {
  const sparse = Array(3);
  sparse[1] = Promise.resolve();
  const values = new module.Marked().walkTokens([{ type: 'space', raw: '\n' }], () => sparse);
  sparsePromiseAll[name] = { ownIndices: Object.keys(values), awaitedResults: await Promise.all(values) };
}
assert.deepEqual(sparsePromiseAll.head.awaitedResults, sparsePromiseAll.base.awaitedResults);
assert.deepEqual(sparsePromiseAll.previous.awaitedResults, sparsePromiseAll.base.awaitedResults);

function doc(n) {
  return Array.from({ length: n }, (_, i) =>
    `## Heading ${i}\n\nParagraph ${i} with **bold** and \`code\`.\n\n- a\n- b\n`,
  ).join('\n');
}
function median(values) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}
const benchmark = [];
for (const n of [500, 1000, 2000, 4000]) {
  const markdown = doc(n);
  const variants = [
    { name: 'base', instance: new base.Marked(), tokens: new base.Marked().lexer(markdown) },
    { name: 'head', instance: new head.Marked(), tokens: new head.Marked().lexer(markdown) },
  ];
  const visitedCounts = variants.map(variant => variant.instance.walkTokens(variant.tokens, () => {}).length);
  assert.equal(visitedCounts[0], visitedCounts[1]);
  const samples = { base: [], head: [] };
  for (let round = 0; round < 5; round++) {
    for (const variant of round % 2 ? [...variants].reverse() : variants) {
      const start = performance.now();
      const values = variant.instance.walkTokens(variant.tokens, () => {});
      samples[variant.name].push(performance.now() - start);
      assert.equal(values.length, visitedCounts[0]);
    }
  }
  const baseMs = median(samples.base);
  const headMs = median(samples.head);
  benchmark.push({ blocks: n, markdownBytes: Buffer.byteLength(markdown), visitedTokens: visitedCounts[0],
    baseMedianMs: baseMs, headMedianMs: headMs, speedup: baseMs / headMs, samples });
}
console.log(JSON.stringify({
  startedAt, completedAt: new Date().toISOString(), node: process.version,
  seed: '0x4121', documentDigestSha256: digest, documentConfigurations,
  denseResultComparisons, visitedTokenComparisons,
  combinedExtensionOrderMatches: true, largeArrayResults, asyncResults, arrayEdges, iteratorComparisons, sparsePromiseAll,
  benchmarkMethod: 'walkTokens only; lexer outside timed section; 1 warmup and 5 alternating base/head samples per size; median; no absolute timing threshold',
  benchmark,
}, null, 2));
