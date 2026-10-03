// AI-assisted exact-commit locale contract audit for payloadcms/payload#17744.
// Run from a Payload checkout containing the four recorded commits.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
const file = 'packages/translations/src/languages/zhTw.ts';
const base = execFileSync('git', ['show', `15d051b5613d79293f607eab4b1a7e535b75b138:${file}`], { encoding: 'utf8' });
const oldBase = execFileSync('git', ['show', `d2b5206968c4f759d37bfb147081e30e55ef17f2:${file}`], { encoding: 'utf8' });
const oldHead = execFileSync('git', ['show', `1b01c5969a3b6dbd2f0da80c9083660b9eee7b10:${file}`], { encoding: 'utf8' });
const head = execFileSync('git', ['show', `86d62f8cbdb08ffb5f34c2dcb0808d68630ae99a:${file}`], { encoding: 'utf8' });
async function flatten(source) {
  const code = stripTypeScriptTypes(source);
  const { zhTwTranslations } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const entries = {};
  function visit(value, path = []) {
    for (const [key, item] of Object.entries(value)) {
      const next = [...path, key];
      if (typeof item === 'string') entries[next.join('.')] = item;
      else visit(item, next);
    }
  }
  visit(zhTwTranslations);
  return entries;
}
const [b, ob, oh, h] = await Promise.all([base, oldBase, oldHead, head].map(flatten));
assert.deepEqual(Object.keys(h).sort(), Object.keys(b).sort());
const originalChanges = Object.keys(ob).filter(k => ob[k] !== oh[k]);
const currentChanges = Object.keys(b).filter(k => b[k] !== h[k]);
assert.deepEqual(currentChanges.sort(), originalChanges.sort());
for (const key of currentChanges) assert.equal(h[key], oh[key]);
function tokens(value) { return [...value.matchAll(/\{\{[^}]+\}\}|<\/?(?:\d+|[a-zA-Z]+)(?:\s[^>]*?)?>/g)].map(m => m[0]).sort(); }
for (const key of Object.keys(b)) assert.deepEqual(tokens(h[key]), tokens(b[key]), key);
const addedKeys = Object.keys(b).filter(k => !(k in ob));
for (const key of addedKeys) assert.equal(h[key], b[key]);
const result = { base: execFileSync('git', ['rev-parse', '15d051b5613d79293f607eab4b1a7e535b75b138'], { encoding: 'utf8' }).trim(), oldHead: '1b01c5969a3b6dbd2f0da80c9083660b9eee7b10', localeKeys: Object.keys(h).length, changedValues: currentChanges.length, originalChangedValuesPreserved: true, keySetPreserved: true, allPlaceholdersAndMarkupPreserved: true, newUpstreamKeysPreserved: addedKeys };
console.log(JSON.stringify(result));
