'use strict';

// Independent regression corpus; source under test is supplied explicitly.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');

async function main() {
  const [sourceFile, outputFile] = process.argv.slice(2);
  if (!sourceFile || !outputFile) {
    throw new Error('Usage: node probe.cjs /path/to/nwsapi.js /path/to/results.json');
  }
  const source = fs.readFileSync(sourceFile, 'utf8');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ content: source });
    const observations = await page.evaluate(() => {
      const cases = [
        ['unknown', 'div:has(:not(:unknown))'],
        ['unknown-suffix', 'div:has(:not(:unknown)) > p'],
        ['private', 'div:has(:not(:-nwsapi-anchor))'],
        ['private-suffix', 'div:has(:not(:-nwsapi-anchor)) > p'],
        ['direct-unknown', 'div:has(:unknown)'],
        ['direct-private', 'div:has(:-nwsapi-anchor)'],
        ['not-unknown', 'div:not(:unknown)'],
        ['not-private', 'div:not(:-nwsapi-anchor)'],
        ['valid-has', 'div:has(p)'],
        ['valid-not', 'div:has(:not(.absent))'],
        ['valid-child', 'div:has(> p)'],
        ['valid-empty', 'div:empty'],
        ['forgiving-is', 'div:has(:is(:unknown, p))'],
        ['forgiving-where', 'div:has(:where(:unknown, p))'],
        ['forgiving-private', 'div:has(:is(:-nwsapi-anchor, p))'],
        ['quoted-private', 'div:has([data-value=":-nwsapi-anchor"])'],
        ['quoted-unknown', 'div:has([data-value=":unknown"])'],
        ['quoted-comma', 'div:has([data-value="a,b"])'],
      ];
      const result = [];
      const take = fn => {
        try { return { value: fn() }; }
        catch (error) { return { error: error.name }; }
      };
      for (const fixture of ['attached-empty', 'attached-populated', 'detached-empty', 'detached-populated', 'no-candidates']) {
        const container = document.createElement('section');
        const target = fixture === 'no-candidates' ? null : document.createElement('div');
        if (target) {
          target.id = 'target';
          if (fixture.endsWith('populated')) {
            for (const value of [':-nwsapi-anchor', ':unknown', 'a,b']) {
              const child = document.createElement('p');
              child.id = 'child-' + target.children.length;
              child.setAttribute('data-value', value);
              target.append(child);
            }
          }
          container.append(target);
        }
        if (fixture.startsWith('attached')) document.body.append(container);
        for (let round = 0; round < 3; round++) {
          // Prime public and relative selector caches before alternating order.
          for (const selector of ['p', 'div', 'div:has(p)', 'div:has(> p)']) {
            NW.Dom.select(selector, container);
          }
          for (const [name, selector] of round % 2 ? [...cases].reverse() : cases) {
            const native = take(() => Array.from(container.querySelectorAll(selector), element => element.id));
            const actual = take(() => NW.Dom.select(selector, container).map(element => element.id));
            result.push({ name, fixture, round, method: 'select', selector, native, actual, equal: JSON.stringify(native) === JSON.stringify(actual) });
            if (target) {
              const expectedMatch = take(() => target.matches(selector));
              const actualMatch = take(() => NW.Dom.match(selector, target));
              result.push({ name, fixture, round, method: 'match', selector, native: expectedMatch, actual: actualMatch, equal: JSON.stringify(expectedMatch) === JSON.stringify(actualMatch) });
            }
          }
        }
        container.remove();
      }
      return result;
    });
    const mismatches = observations.filter(item => !item.equal);
    const report = {
      node: process.version,
      chromium: browser.version(),
      sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
      total: observations.length,
      mismatchCount: mismatches.length,
      mismatches,
      observations,
    };
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ total: report.total, mismatches: report.mismatchCount, chromium: report.chromium }));
    if (mismatches.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 2; });
