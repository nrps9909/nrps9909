// Usage (Node 24): node payload-zhtw-merge-audit.mjs TESTED_BASE TESTED_HEAD MERGE_PARENT MERGED OUTPUT.json
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
const [testedBaseFile, testedHeadFile, parentFile, mergedFile, outputFile] = process.argv.slice(2);
async function flatten(file) {
  const code = stripTypeScriptTypes(readFileSync(file, 'utf8'));
  const { zhTwTranslations } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const out = {};
  function visit(value, path = []) {
    for (const [key, item] of Object.entries(value)) {
      const next = [...path, key];
      if (typeof item === 'string') out[next.join('.')] = item;
      else visit(item, next);
    }
  }
  visit(zhTwTranslations);
  return out;
}
const [oldBase, head, parent, merged] = await Promise.all([testedBaseFile, testedHeadFile, parentFile, mergedFile].map(flatten));
const originalChanged = Object.keys(oldBase).filter(k => oldBase[k] !== head[k]).sort();
const mergedChanged = Object.keys(parent).filter(k => parent[k] !== merged[k]).sort();
assert.equal(originalChanged.length, 23);
assert.deepEqual(mergedChanged, originalChanged);
assert.deepEqual(Object.keys(merged).sort(), Object.keys(parent).sort());
for (const key of originalChanged) assert.equal(merged[key], head[key], key);
const addedAfterHead = Object.keys(parent).filter(k => !(k in head)).sort();
for (const key of addedAfterHead) assert.equal(merged[key], parent[key], key);
const tokens = value => [...value.matchAll(/\{\{[^}]+\}\}|<\/?(?:\d+|[a-zA-Z]+)(?:\s[^>]*?)?>/g)].map(m => m[0]).sort();
for (const key of Object.keys(parent)) assert.deepEqual(tokens(merged[key]), tokens(parent[key]), key);
const differencesVsHead = Object.keys(merged).filter(k => !(k in head) || merged[k] !== head[k]).sort();
assert.deepEqual(differencesVsHead, addedAfterHead);
assert.deepEqual(addedAfterHead, ['general.skipToContent', 'hierarchy.searchResults']);
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const result = { checked_at_utc: new Date().toISOString(), runtime: process.version,
  tested_head_keys: Object.keys(head).length, merged_keys: Object.keys(merged).length,
  original_changed_values: originalChanged.length, original_values_preserved: true,
  merge_parent_key_set_preserved: true, all_placeholders_and_markup_preserved: true,
  new_upstream_keys_preserved: addedAfterHead, new_upstream_values: Object.fromEntries(addedAfterHead.map(k => [k, merged[k]])),
  existing_tested_head_values_preserved: true, merged_blob_identical_to_tested_head: false,
  sha256: { tested_base: sha256(testedBaseFile), tested_head: sha256(testedHeadFile), merge_parent: sha256(parentFile), merged: sha256(mergedFile) },
  scope: 'Serialized locale contract only; prior 15 utility tests remain evidence for the unchanged authored head, not a rerun on the squash commit.' };
writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
