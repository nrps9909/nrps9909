// AI-assisted independent link-state corpus for markedjs/marked#4123.
// Usage: node marked-4123-probe.mjs BASE_ESM HEAD_ESM [MERGE_PREVIEW_ESM]
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [basePath, headPath, previewPath] = process.argv.slice(2);
assert.ok(basePath && headPath, 'Supply base and head ESM modules');
const modules = {
  base: await import(pathToFileURL(resolve(basePath))),
  head: await import(pathToFileURL(resolve(headPath))),
};
if (previewPath) modules.preview = await import(pathToFileURL(resolve(previewPath)));
const startedAt = new Date().toISOString();
const images = [
  '![logo](logo.png)', '![logo][image]', '![logo][]', '![logo]',
  '![![logo](inner.png)](outer.png)', '![logo](logo.png "title")',
];
const bareTexts = [
  'www.example.com', 'https://example.com/a', 'http://example.com/path',
  'user@example.com', 'sub.user@example.co.uk', 'www.example.com/path?q=1&x=2',
];
const decorators = [s => s, s => `*${s}*`, s => `**${s}**`, s => `~~${s}~~`];
const outsideTexts = ['', ' www.outside.example', ' user@outside.example', ' https://outside.example/x'];
const defs = '\n\n[image]: logo.png\n[logo]: logo.png\n[target]: https://target.example\n';
const expectedOutside = [null, 'http://www.outside.example', 'mailto:user@outside.example', 'https://outside.example/x'];
const cases = [];
for (const image of images) for (const bare of bareTexts) for (const decorate of decorators) {
  for (const reference of [false, true]) for (let outside = 0; outside < outsideTexts.length; outside++) {
    for (const placement of ['before', 'after', 'both']) {
      const content = placement === 'before' ? `${image} ${bare}`
        : placement === 'after' ? `${bare} ${image}` : `${image} ${bare} ${image}`;
      const outer = reference ? `[${decorate(content)}][target]` : `[${decorate(content)}](https://target.example)`;
      cases.push({ markdown: outer + outsideTexts[outside] + defs, placement, outside });
    }
  }
}

// Generated inputs contain no raw anchor HTML. Inspect the serialized output,
// rather than a browser tree that may repair invalid nested anchor elements.
function anchors(html) {
  let depth = 0;
  let maximumDepth = 0;
  const hrefs = [];
  for (const match of html.matchAll(/<(\/?)a(?:\s[^>]*)?>/gi)) {
    if (match[1]) depth--;
    else {
      depth++;
      maximumDepth = Math.max(maximumDepth, depth);
      const href = /\bhref="([^"]*)"/.exec(match[0]);
      assert.ok(href, match[0]);
      hrefs.push(href[1].replaceAll('&amp;', '&'));
    }
    assert.ok(depth >= 0, html);
  }
  assert.equal(depth, 0, html);
  return { hrefs, maximumDepth };
}

const observations = {};
let comparedTokenStreams = 0;
for (const [name, module] of Object.entries(modules)) {
  const results = { observations: 0, violations: 0, nestedAnchorCases: 0, gfm: {}, firstViolations: [] };
  for (const gfm of [true, false]) {
    const marked = new module.Marked({ gfm, pedantic: false });
    let violations = 0;
    for (const item of cases) {
      const html = marked.parse(item.markdown);
      const actual = anchors(html);
      const expected = ['https://target.example'];
      if (gfm && expectedOutside[item.outside]) expected.push(expectedOutside[item.outside]);
      const matches = actual.maximumDepth === 1 && JSON.stringify(actual.hrefs) === JSON.stringify(expected);
      results.observations++;
      if (!matches) {
        results.violations++;
        violations++;
        if (actual.maximumDepth > 1) results.nestedAnchorCases++;
        if (results.firstViolations.length < 3) results.firstViolations.push({ markdown: item.markdown, html, expected, actual });
      }
      if (name !== 'base' && (!gfm || item.placement === 'after')) {
        const baseline = new modules.base.Marked({ gfm, pedantic: false });
        assert.equal(html, baseline.parse(item.markdown), 'control HTML changed');
        assert.deepEqual(marked.lexer(item.markdown), baseline.lexer(item.markdown), 'control token stream changed');
        comparedTokenStreams++;
      }
    }
    results.gfm[String(gfm)] = { observations: cases.length, violations };
  }
  observations[name] = results;
  if (name !== 'base') assert.equal(results.violations, 0, `${name} anchor/destination invariant`);
}
assert.ok(observations.base.violations > 0, 'The corpus must reproduce baseline failures');

const stateChecks = {};
for (const [name, module] of Object.entries(modules)) {
  const result = [];
  for (const inLink of [false, true]) for (const linkEmitted of [false, true]) {
    for (const image of ['![logo](logo.png)', '![![logo](inner.png)](outer.png)']) {
      const lexer = new module.Lexer({ gfm: true, pedantic: false });
      lexer.state.inLink = inLink;
      lexer.state.linkEmitted = linkEmitted;
      const tokens = lexer.inlineTokens(image);
      result.push({ inLink, linkEmitted, image, afterInLink: lexer.state.inLink, afterLinkEmitted: lexer.state.linkEmitted, tokens: tokens.length });
      if (name !== 'base') {
        assert.equal(lexer.state.inLink, inLink);
        assert.equal(lexer.state.linkEmitted, linkEmitted);
      }
    }
  }
  stateChecks[name] = result;
}

const fixtureParagraphs = [
  '[![logo](logo.png) www.example.com](https://target.example)',
  '[![logo](logo.png) https://example.com](https://target.example)',
  '[![logo](logo.png) user@example.com](https://target.example)',
  '[![logo][image] www.example.com][target]',
  '[![![logo](inner.png)](outer.png) www.example.com](https://target.example)',
  '[![logo](logo.png)](https://target.example) www.example.com',
];
const fixtureResults = {};
for (const [name, module] of Object.entries(modules)) {
  fixtureResults[name] = fixtureParagraphs.map((paragraph, i) => {
    const html = new module.Marked({ gfm: true }).parse(paragraph + defs);
    const actual = anchors(html);
    const expected = i === 5 ? ['https://target.example', 'http://www.example.com'] : ['https://target.example'];
    return { paragraph: i + 1, passed: actual.maximumDepth === 1 && JSON.stringify(actual.hrefs) === JSON.stringify(expected) };
  });
}
assert.equal(fixtureResults.base.filter(x => !x.passed).length, 5);
assert.equal(fixtureResults.head.filter(x => !x.passed).length, 0);
console.log(JSON.stringify({
  startedAt, completedAt: new Date().toISOString(), node: process.version,
  markdownConfigurations: cases.length,
  uniqueMarkdownDocuments: new Set(cases.map(x => x.markdown)).size,
  documentDigestSha256: createHash('sha256').update(JSON.stringify(cases)).digest('hex'),
  observations, comparedControlTokenStreams: comparedTokenStreams,
  directImageStateChecks: stateChecks, originalFixtureParagraphs: fixtureResults,
  browserDOMNotTested: true, exhaustiveSpecificationConformanceClaimed: false,
}, null, 2));
