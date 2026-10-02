# Marked #4121 independent review (2026-10-02)

Reviewed head: `920d86db9d65d87e39851c84364ed71488cb667a`

Base: `4ee44f7f2167bec4079255e32b520dd47f16486c`

[Published COMMENTED review](https://github.com/markedjs/marked/pull/4121#pullrequestreview-5387675763) and [array compatibility note](https://github.com/markedjs/marked/pull/4121#discussion_r4162296054). The PR remains open; this is neither approval nor merge evidence. AI assistance is disclosed in the review and probe.

## Reproduce

Build a clean checkout of each recorded commit with its lockfile (`npm ci`, then `npm run build`). Pass their ESM bundles to the standalone probe:

```sh
node marked-4121-probe.mjs /path/to/base/lib/marked.esm.js /path/to/head/lib/marked.esm.js
```

Node 26.10.0 / npm 11.19.1 were used locally. The probe prints JSON without changing either checkout. `marked-4121-probe.json` is the recorded output, including all timing samples. Timings are **walkTokens only**, exclude lexing, use one warmup and five alternating samples per size, and have no absolute pass/fail threshold. They do not measure whole parsing, browser responsiveness or every possible token-tree depth.

The deterministic corpus executes 512 generated samples under four options (2,048 document/option observations; sampled inputs may repeat), four callback result modes (8,192 comparisons), and 317,080 token visits. One nested-array mode deliberately matches the PR's broader runtime test rather than the public TypeScript result type. Dense results/order, HTML, extension order, a 200,000-element return array and nested asynchronous callbacks match base. Separately, sparse holes become own undefined slots, and a custom callback-array iterator can omit a promise from the public walkTokens result. The async edge is reproduced on base/head without changing runtime source.

The full `npm test` passes on head and base with the PR's four new tests: each run has 1,863 specification tests and 197 unit tests, plus builds, UMD/CJS, type/package checks and lint. This comparison does not claim the added tests fail on base. The temporary base test patch was restored and both source checkouts are clean.

`marked-4121-callback-types.mts` records the strict callback contract check. Adjust its import to your head checkout's `src/marked.ts`, then run the checkout's TypeScript with:

```sh
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --allowImportingTsExtensions /path/to/marked-4121-callback-types.mts
```

An initial explicit-file check omitted TypeScript 6's required `--ignoreConfig` and stopped with TS5112; only the corrected exit-0 check is validation evidence. GitHub's separate CI snapshot reports seven successful checks and one skipped release. No physical browser test or current-head approval is claimed.
