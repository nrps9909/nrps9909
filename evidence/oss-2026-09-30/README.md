# Independent upstream review probes — September 30, 2026

The [dated evidence](../oss-2026-09-30.json) records three published reviews with their exact commits and readback receipts. These are reviews of other authors' PRs, not authored merged contributions.

The probes use an external review workspace with `util/` (installed dependencies), `util-review-817/`, `util-review-818/`, and `dayjs-review-3240/` (installed dependencies). Fetch the commits recorded in each script into its corresponding Git repository. Set `OSS_REVIEW_ROOT` to that workspace. Node 24.15.0 was used for the original reviews; the portable scripts were also rerun successfully with Node 26.10.0. The `*-node24.json` files preserve the original measurements, while the default output filenames record the portable rerun.

```sh
OSS_REVIEW_ROOT=/path/to/review-workspace node util-isEqual-probe.cjs
OSS_REVIEW_ROOT=/path/to/review-workspace node --expose-gc util-container-gc-probe.cjs
OSS_REVIEW_ROOT=/path/to/review-workspace node dayjs-week-probe.cjs
```

- `util-isEqual-probe.cjs`: independently compiles the actual base/head `isEqual.ts` sources and runs 4,840 comparisons each. It checks results and circular-warning decisions with a direct warning spy; the upstream Jest tests separately validate the real warning module.
- `util-container-gc-probe.cjs`: compiles the actual base/head `dynamicCSS.ts` sources and exercises them with JSDOM ShadowRoots and WeakRefs. It uses DOM-availability/containment adapters. Three fresh module instances each retain 30/30 roots on base and 0/30 on head after explicit GC; resetting the base cache releases its roots. This is a Node/V8 retention experiment, not a Chromium heap-size or application-memory benchmark.
- `dayjs-week-probe.cjs`: loads each actual source revision in separate processes across UTC, New York, London and Auckland. Weeks 1–52, 2020–2029, both week tokens, and three aligned global/requested locale configurations yield 12,480 UTC and 12,480 local comparisons per version. It compares with Moment's equivalent week setter and checks normal-date/explicit-offset controls. This does not cover every locale/plugin combination.

Each script writes its JSON result beside itself. Full repository checks and inherited failures are documented in the linked reviews; these probes do not replace upstream CI or maintainer acceptance.
