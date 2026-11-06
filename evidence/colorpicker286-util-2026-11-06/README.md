# ColorPicker #286: published util useMobile follow-up

Source: [existing author PR #286](https://github.com/react-component/color-picker/pull/286) at `fce493d2113c33127a87aca99c9f5fe3ad1d72a3`. The existing author retains the PR; no duplicate source branch or PR was opened.

Maintainer [release notice](https://github.com/react-component/color-picker/pull/286#discussion_r4488006064) points to [util 1.14.1](https://github.com/react-component/util/releases/tag/%40rc-component%2Futil%401.14.1). The actual npm tarball integrity and both ESM/CJS root exports/declarations were verified. util1.14.0 does not export useMobile at its root.

[candidate.patch](candidate.patch) changes Handler to the public root import, adapts the existing mobile fixture with a partial public-module mock, and raises the declared minimum dependency from ^1.11.1 to ^1.14.1. Raising the minimum matters: the older range permits releases without the new export.

Apply only at the stated PR head with `git apply --check candidate.patch` followed by `git apply candidate.patch`. Install the declared dependency and use the repository's test/check commands. A temporary isolated util1.14.1 package was used for validation: 69 tests/3 files, TypeScript, lint (0 errors/1 existing warning), package compile (ESM/CJS/declarations/Less), and formatting pass. See [validation.json](validation.json). Source/manifest and the original util1.14.0 dependency were restored afterward. This is a candidate, not upstream adoption, approval, merge, remote CI or real screen-reader validation.

The patch retains source provenance and the upstream MIT notice in [LICENSE-upstream](LICENSE-upstream). AI-assisted analysis, candidate preparation and validation.
