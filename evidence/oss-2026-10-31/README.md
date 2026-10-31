# Current-head review follow-up — 2026-10-31

[Structured results and exact commits](../oss-2026-10-31.json). All four PRs remain open and unmerged. These are review/candidate results, not adopted upstream patches or new authored merges. Work used Node 24.15.0 and each checkout's declared dependency ranges; [resolved versions](resolved-validation-environments.json) are recorded. Local installs used `--legacy-peer-deps --ignore-scripts --package-lock=false`, without manifest/lock changes. They do not reproduce a frozen upstream CI environment.

## Picker #990

Exact source head: `c028f1d40e8166a093c8e5100e04900564e80e9f`. [Maintainer's compatibility request](https://github.com/react-component/picker/pull/990#discussion_r4429951662), [tested follow-up](https://github.com/react-component/picker/pull/990#discussion_r4430404424).

Unmodified head: 16 suites / 487 passed / 2 skipped / 29 snapshots; TypeScript, lint (0 errors / 16 warnings) and compile pass. The earlier selector failure no longer reproduces. This does not constitute a full source re-review of all inherited master refactors.

To reproduce the compatibility comparison, copy `picker990-compat-probe.tsx` into the exact checkout as `tests/review-footer-compat.spec.tsx`. Run `npm test -- --runInBand`. The ten new Single/Range cases check native rendering, legacy-only, each new override with legacy, and both new overrides, including native/custom type props. Four new cases fail on head; six controls pass. The wrapper runs the full suite even when an additional filename argument is supplied: the observed head+probe result is 4 failed / 493 passed / 2 skipped.

Apply `picker990-ok-only-candidate.patch` from the checkout root using `git apply`, retaining the probe. The two-line runtime candidate keeps Now independent from legacy OK customization, and corrects the two existing legacy fixtures. The entire suite passes 17 suites / 497 tests / 2 skips / 29 snapshots; `npm run tsc` and `npm run compile` pass. The patch is a candidate awaiting the author, and the PR migration text also needs updating. Restore the original files and remove the temporary probe after review; do not apply to a checkout with uncommitted changes.

## ColorPicker #286

Exact head: `fce493d2113c33127a87aca99c9f5fe3ad1d72a3`. [Change request](https://github.com/react-component/color-picker/pull/286#pullrequestreview-5721109008).

Submitted head passes 69 tests, TypeScript, ordinary lint (0 errors / 1 warning), and formatting. `npm run compile` fails the father-plugin internal-import rule on Handler.tsx:2. Replacing only Handler.tsx with its prior reviewed `a093513197455313dba1c9d4e32811b49188c7bd` source makes compilation pass under the same dependency tree.

Copy `colorpicker286-keyboard-probe.tsx` to `tests/review-keyboard.test.tsx`, then run `npm test -- tests/review-keyboard.test.tsx`. Head passes all four Enter/Space composition/cancellation cases. Restoring only ColorBlock.tsx from the prior reviewed commit gives two activation failures / two cancellation controls passing.

The candidate `colorpicker286-public-api-candidate.patch` uses public `isMobile` / `useLayoutEffect`, initially false state, and a partial mock of the public detector in the fixture. Apply it only on the exact head in a clean checkout. `npm run compile`, `npm run tsc`, and all 69 submitted tests pass with it. The initial candidate run with the unadapted old hook mock failed the mobile fixture; that failure is retained in the private/local raw logs and is not represented as a clean first attempt. No candidate was pushed to the author's branch.

## FastColor #96 and Validator #2883

[FastColor follow-up](https://github.com/ant-design/fast-color/pull/96#pullrequestreview-5721111770): current head `0c8a743468234cafd266b59827fac63743f3dce2` passes 212 tests, lint and compile. With only src/FastColor.ts restored to base `c8c556dda85401879815092ec5da865f246b9a9d`, the same full suite has three failing boundary regressions / 209 passing controls. The normalization is verified; the newly asserted downstream canvas explanation remains unverified and was raised for correction or a precise reproducer. Earlier change request is not cleared.

[Validator follow-up](https://github.com/validatorjs/validator.js/pull/2883#pullrequestreview-5721112113): current head `480a8a7220e3e895854cc2006efa31f62b45a5f9` passes its complete `npm test` (327 tests, builds and lint). After building, run the supplied `validator2883-public-probe.cjs` using the checkout's Babel register configuration, e.g. `node -r @babel/register /absolute/path/to/validator2883-public-probe.cjs "$PWD"` from that checkout. Four public forms agree on 12 username samples, non-string type controls, and empty numeric controls. The accepted whitespace/control characters and UTF-16 length contract still require documentation/tests; the removed numeric fix should no longer be advertised in the title.

There was no new native-browser or screen-reader testing in this round. DOM tests do not establish VoiceOver/TalkBack usability or general accessibility conformance. AI assistance: Codex helped inspect source, construct and run controlled tests/candidates, and prepare the review records; exact heads and posted messages were read back.

Patches reference MIT-licensed upstream projects: [react-component/picker](https://github.com/react-component/picker/blob/c028f1d40e8166a093c8e5100e04900564e80e9f/LICENSE), [react-component/color-picker](https://github.com/react-component/color-picker/blob/fce493d2113c33127a87aca99c9f5fe3ad1d72a3/LICENSE). Retain the upstream license/attribution when using the source or patches. Probes in this directory are MIT-licensed; see LICENSE.
