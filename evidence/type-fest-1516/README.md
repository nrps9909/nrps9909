# Writable empty-key selection review

## September 7 update: old candidate superseded

**Do not apply the old patch below.** Maintainer [sindresorhus identified](https://github.com/sindresorhus/type-fest/pull/1516#issuecomment-5561132587) that `undefined extends Keys` also accepts selected-key unions containing `undefined`. My candidate had the same missing coverage. The author updated head `a7ec8550c5989649bb1b3fd8d328663e18bb330d` to use an exact sentinel check.

The [published follow-up](https://github.com/sindresorhus/type-fest/pull/1516#pullrequestreview-5128779168) records 303 observations each for the old candidate and updated upstream head on TypeScript 5.9.3, 6.0.3 and 7.0.2. My old candidate has 45 failures: 42 newly covered union-key readonly failures and three inherited generic failures. The updated upstream head passes 300/303, fixing all 42 union-key failures and retaining the original empty-key repair. Full tsc/tsd, 38 Node tests and focused lint pass; four inherited full-suite XO errors remain.

[Expanded compiler results](./compiler-matrix-2026-09-07.json) preserve the actual compiler exits and expected diagnostics. Nonzero compiler exits are expected for negative assignment checks; classified observations determine the result. The original 175-case base/head runs and expanded 303-case candidate/latest runs have different denominators. The review is COMMENTED, not a formal approval. This directory preserves the old patch solely as historical evidence.

## September 6 investigation (historical)

Reviewed [type-fest #1516](https://github.com/sindresorhus/type-fest/pull/1516#pullrequestreview-5125224510) on September 6, 2026. This is a COMMENTED review by an external contributor, with no approval or adopted-fix claim.

- Base: `5715dfe23dc5853a148afa37df3c0a698ca9cbb9`
- Reviewed head: `08b29d21cf4391350dd73f0c94bc1f0b4927c582`
- [Candidate patch](./empty-key-selection.patch), based on that head, includes seven negative regression assertions. It is a proposal for the existing PR, not a competing upstream PR.
- [Compiler results](./compiler-matrix.json) record 175 independent observations per implementation on each of TypeScript 5.9.3, 6.0.3 and 7.0.2, using Node 24.15.0 and strict/exact-optional-property checking.

An empty selection should leave all properties readonly:

```ts
import type {Writable} from 'type-fest';

type RecordData = {readonly id: string};
type EditableKeys = Extract<keyof RecordData, `editable${string}`>;
declare const data: Writable<RecordData, EditableKeys>;
data.id = 'changed'; // Base: TS2540. Reviewed head: accepted.
```

The head uses `never` to represent an omitted argument, so both an explicit `never` and a computed empty key selection make all object properties writable. Negative assignment checks cover optional, numeric and symbol properties and named/arbitrary index-signature writes. Non-empty subsets, omitted/all keys, arrays, tuples, maps, sets, nested readonly values, `any`, `never`, `unknown`, and polymorphic class/function usage provide controls.

| Result per compiler | Base | Reviewed head | Candidate |
| --- | ---: | ---: | ---: |
| Passing observations out of 175 | 169 | 160 | 172 |
| Failing observations | 6 | 15 | 3 |
| Newly lost readonly restrictions compared with base | 0 | 12 | 0 |

The candidate reserves `undefined` for the omitted argument, tests `undefined extends Keys`, and narrows keys for `Except`. It preserves the head's three successful default-argument repairs and eliminates its 12 new failures. All three compilers return the same result. The three remaining explicit-`keyof` generic failures are inherited; this candidate does not resolve them. Using an `undefined` default is a proposed API implementation choice for the maintainers to assess.

The seven assertions added in the patch all fail on the reviewed head with TS2578 (unused expected error), and all pass with the candidate. Repository-wide `test:tsc` and `test:tsd` pass on head and candidate. The Node runner passes 38 tests; focused source/test lint passes for the candidate. Full `npm test` remains blocked by the same four XO errors in unchanged `test-d/abstract-class.ts` and `test-d/readonly-deep.ts`. These reproduce on the exact base using the same dependencies and match [upstream CI](https://github.com/sindresorhus/type-fest/actions/runs/34021163626). Those files were not edited.

Type-fest source and patch context retain the project's [MIT or CC0 licensing](https://github.com/sindresorhus/type-fest/tree/08b29d21cf4391350dd73f0c94bc1f0b4927c582). AI-assisted investigation with independently executed compiler checks.
