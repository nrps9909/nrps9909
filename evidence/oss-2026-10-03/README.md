# October 3, 2026: follow-up verification

These AI-assisted probes preserve the recorded commit boundaries. The [snapshot](../oss-2026-10-03.json) contains the merge, signed maintenance, review and CI receipts. The previous October 2 probe and results remain unchanged.

## Marked #4121

Base: `4ee44f7f2167bec4079255e32b520dd47f16486c`; previous reviewed head: `920d86db9d65d87e39851c84364ed71488cb667a`; current head: `05a9875c0590ed9fae184448d81edf982212cbf5`.

Create three clean checkouts at those commits. Install the current head with `npm ci --ignore-scripts --no-audit --no-fund`, then use that checkout's esbuild executable to bundle **each** `src/marked.ts` with identical `--bundle --format=esm --minify` options. This is the procedure used for the recorded comparison. Pass the three generated ESM paths in base/current/previous order:

```sh
node marked-4121-probe.mjs /path/to/base.esm.mjs /path/to/head.esm.mjs /path/to/previous.esm.mjs
```

The probe compares 2,048 document/option observations, 8,192 callback-result observations and 317,080 token visits; those are observations, not a claim of unique documents. Five custom-iterator cases fail on the previous head and pass on base/current head. The pending-promise case now waits correctly. Sparse holes become own `undefined` entries by the author's stated choice; tested `Promise.all` results still match. JSON serializes undefined array entries as `null`.

The 4,000-block traversal median was 2,681.44 ms on base and 1.86 ms on current head, with one warmup and five alternating samples. Lexing is outside the timed section. These local traversal measurements establish neither whole-parse nor browser performance; no absolute timing threshold is asserted. Complete current-head `npm test` separately passed 1,863 specification tests and 198 unit tests, builds, type/package checks and lint. The published follow-up is APPROVED at the recorded commit; the PR is open.

## Payload #17744

Run `node /path/to/payload-zhtw-contract-audit.mjs` from a Payload checkout containing current base `15d051b5613d79293f607eab4b1a7e535b75b138`, old base `d2b5206968c4f759d37bfb147081e30e55ef17f2`, old head `1b01c5969a3b6dbd2f0da80c9083660b9eee7b10` and signed current head `86d62f8cbdb08ffb5f34c2dcb0808d68630ae99a`. Node 26.10.0 was used; the audit uses built-in TypeScript stripping and checks committed source without changing the checkout.

The recorded result preserves 671 locale keys, the exact original 23 corrected values, interpolation/markup tokens and all 12 new upstream keys. Package declarations/SWC build, lint (0 errors / 13 existing warnings), formatting and the repository's two translation utility files / 15 unit tests pass. The initial filtered-install unit startup failure is distinct from the successful run after complete frozen-lockfile installation. This is content/scoped unit evidence, with no rendered UI, screen-reader, full monorepo CI or WCAG-conformance claim. The signed head is mergeable and open; the new CI workflow needs maintainer authorization and review is required again.
