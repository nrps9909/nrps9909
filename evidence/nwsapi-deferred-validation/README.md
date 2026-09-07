# NWSAPI deferred selector validation regression corpus

An independent follow-up to [NWSAPI #201](https://github.com/dperini/nwsapi/pull/201#issuecomment-5566181555), comparing the previously reviewed `36f19c8ab2b0dc230a7e5194a91507a55d0da3ad` with the merged `8227098ca8bf636ba8331bf0717c357bfe7c0b8a`. The author fixed the reported public/private selector isolation issue. A broader argument-validation gap remains when candidate elements are absent.

## Observed results

Node 26.8.1, Playwright 1.62.1, Chromium 151.0.7922.34:

| Corpus | Previously reviewed | Merged |
| --- | ---: | ---: |
| Observations | 486 | 486 |
| Native-result mismatches | 174 | 84 |
| Valid selector/control mismatches (270 observations) | 24 | 0 |

90 observations become correct, with zero new failing observations. The remaining 84 represent 28 distinct fixture/method/selector paths repeated across three cache rounds. This expanded corpus has a different denominator from the earlier 504-observation isolation check; the totals must not be combined or interpreted as unique bugs.

A minimal remaining example is an empty container:

```js
const container = document.createElement('section');
container.querySelectorAll('div:not(:unknown)'); // Chromium: SyntaxError
NW.Dom.select('div:not(:unknown)', container);  // Both versions: []
```

The same boundary appears with the old private pseudo spelling and an unrelated unknown pseudo. Matching a childless div with nested `:has(:not(...))` also retains deferred validation. These are inherited behaviors, not evidence that the merged parser still publicly recognizes the private pseudo. The corpus preserves valid child selectors, empty matching, forgiving `:is()` / `:where()` lists and quoted attribute controls.

## Reproduce

Use an isolated directory with Node 26. Download `probe.cjs` from this directory, then:

```sh
npm install --no-save @playwright/test@1.62.1
npx playwright install chromium
curl -fL https://raw.githubusercontent.com/dperini/nwsapi/36f19c8ab2b0dc230a7e5194a91507a55d0da3ad/src/nwsapi.js -o previous.js
curl -fL https://raw.githubusercontent.com/dperini/nwsapi/8227098ca8bf636ba8331bf0717c357bfe7c0b8a/src/nwsapi.js -o merged.js
node probe.cjs previous.js previous.json
node probe.cjs merged.js merged.json
```

Each probe intentionally exits **1** when mismatches exist, **0** when all observations agree and **2** for execution errors. Run both commands even when the first returns 1. Each output contains all observations, diagnostics, browser/runtime versions and source SHA-256; no absolute source paths are recorded. [results.json](./results.json) provides the checked summary and all 28 remaining paths.

The comparison uses native Chromium as the reference and is scoped to these selectors and fixtures. It is not complete standards conformance, a proposed parser fix or an npm release claim. The original repository's passing tests and expected failures remain separately documented. AI-assisted investigation, independently executed. The probe code is available under the [MIT license](./LICENSE).
