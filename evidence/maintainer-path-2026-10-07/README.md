# rc-menu #898: reproducible maintenance review

[Review](https://github.com/react-component/menu/pull/898#pullrequestreview-5439489565) · [Collaborator maintenance proposal](https://github.com/ant-design/ant-design/issues/3222#issuecomment-6033907706) · [Responsibility path](../../MAINTAINER_PATH.md)

The source patch belongs to the PR author. My contribution is independent regression review and follow-up. AI assistance is disclosed in both upstream messages. No duplicate implementation PR was opened.

## Tested commits and environment

- Base: `8dfdef453a24cee1bda115e3249b17289356829d`
- Authored head: `6fc01b8b9a62446e38664c0b982b7957de9d5b6b`
- GitHub merge preview: `4df8100043f66cb2fd3901419355063822274004`, parents = base / head.
- Node 24.15.0, npm 12.0.2, React / React DOM 19.3.0, rc-test 7.1.3, TypeScript 6.0.3, util 1.13.0, esbuild 0.28.2, Playwright 1.62.1, Chrome 154.0.8037.98. The repository has no lockfile; resolved dependency versions are recorded locally, and the key runtime versions are listed here. This is not a reproducible lockfile claim.

The first install encountered an ESLint 10 / eslint-plugin-react peer conflict. Command-only `--legacy-peer-deps` matches the repository preview workflow. Lifecycle scripts were disabled and no source, lock, or global configuration was changed.

## Results

Base passes 13 suites / 144 tests / 20 snapshots. Head and merge preview each pass 13 / 146 / 20. The copied author Focus suite on base has two expected failures and seven passing controls; the runner also executes the original 144 tests, for 151 passes / 2 failures overall. Head TypeScript and package compile pass; lint has 0 errors / 11 warnings. Existing React act warnings are retained in the local logs.

The real-browser probe checks twelve observations per implementation, using fresh mounted DOM for each scenario. Head/preview fix native Enter navigation after first/ref focus, but:

1. Native Enter triggers `keydown` and `click` callbacks. With `multiple`, selection is immediately reversed. Base's first/ref-focus path has one callback / one selected item. Base also has the old double-activation after arrow-focus reaches an anchor; this existing boundary is explicitly retained.
2. `findItem(...).focus({preventScroll:true})` now jumps from scrollY 0 to 1267. The subsequent anchor focus causes the scroll. Base stays at 0. MenuRef.focus(options) still preserves 0. Direct focus emits li then anchor focus callbacks.

Controls cover ArrowDown, Home/End, disabled-first skipping, controlled activeKey, and a plain item's focus fallback. These are native DOM / keyboard / scroll checks, not screen-reader testing or exhaustive WCAG conformance. Remote Vercel failure and available successful checks remain distinct from local success. The PR remains open, not merged.

## Reproduce

Clone three independent checkouts under a scratch directory named in `MENU_REVIEW_ROOT`, and check out the commits above. Use these directory names:

```text
menu-maintainer-898-base-20261007
menu-maintainer-898-head-20261007
menu-maintainer-898-preview-20261007
```

Install the head dependencies using the command below, then link its node_modules into base and preview, or install identical dependencies separately:

```sh
npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund --package-lock=false
npm test -- --runInBand
npm run tsc
npm run lint
npm run compile
```

Run the complete tests in base and preview too. To reproduce the author's red tests, copy `menu-898-base-regression.spec.tsx` into base's `tests/` directory, run tests, and then remove the temporary copy. The fixture comes from rc-menu under MIT, with its license retained.

Install esbuild 0.28.2 and Playwright 1.62.1 in a separate probe dependency directory. `ESBUILD_MODULE` and `PLAYWRIGHT_MODULE` may point to those installed module directories; otherwise the runner resolves the package names normally. Use an installed Chrome executable with `CHROME_EXECUTABLE`, or install Playwright's Chromium for the default launch. Keep the harness next to the runner:

```sh
MENU_REVIEW_ROOT=/absolute/path/to/scratch \
ESBUILD_MODULE=/absolute/path/to/probe/node_modules/esbuild \
PLAYWRIGHT_MODULE=/absolute/path/to/probe/node_modules/playwright \
CHROME_EXECUTABLE=/absolute/path/to/chrome \
node menu-898-browser-probe.cjs
```

The script serves only on loopback, builds all three source commits with the same production options and dependency pool, drives native keys, checks both the fix and regressions, writes `menu-898-browser-results.json`, then closes its browser and server. Temporary dependencies / fixtures are removed from the base and preview after local validation. All three source checkouts are clean.
