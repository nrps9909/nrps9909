# October 4, 2026: Marked #4123 verification

AI-assisted review of [Marked #4123](https://github.com/markedjs/marked/pull/4123), with a [dated snapshot](../oss-2026-10-04.json). Head: `00073f9e91ebab73a67949cc9e9cf02de2dc8a84`; current base: `c18a64fa5e8c97cb92a8ea709a4542ea94b1c740`; common ancestor: `c61543ed0f16121ace9255626abcafe9514cb1b0`. The checked GitHub merge preview is `038f750048fe1118650b21cf32b275d72c641936`, whose two parents match current base/head.

Create separate clean checkouts at base and head. With Node 24.15.0 / npm 12.0.2, use the frozen package lock:

```sh
npm ci --ignore-scripts --no-audit --no-fund --allow-remote=all
npm test
```

The initial install without remote opt-in fails at npm 12's default `EALLOWREMOTE` restriction. The recorded lock contains one non-registry tarball: `@markedjs/testutils`' Marked v18.0.11 test corpus, with integrity metadata. The opt-in above is per command; lifecycle scripts stay disabled and no global configuration or source/lockfile changes are needed. Review your checkout's lock before enabling URL downloads. This is recorded setup evidence rather than a CI failure.

Run the independent corpus against the generated ESM modules. The optional third path is a separately built merge preview:

```sh
node marked-4123-probe.mjs /path/to/base/lib/marked.esm.js /path/to/head/lib/marked.esm.js /path/to/preview/lib/marked.esm.js
```

The probe uses 3,456 distinct Markdown inputs and GFM on/off, for 6,912 observations per implementation. It checks serialized anchor depth and exact destinations, image/reference nesting, formatting, bare URL/email positions, outside autolinks, and seeded lexer flags. Base has 2,304 nested-anchor/destination violations; head/preview have zero. The 9,216 head/preview control token streams and HTML results match base. Eight seeded image state cases per implementation check `inLink` and `linkEmitted` restoration.

The PR fixture independently has five failing base paragraphs plus one passing outside-autolink control. Both head and preview pass all six. Adding only the fixture to base fails the repository's standard HTML differ; Node 24 reports two failed parent/child test records for that one selected fixture. The temporary added files were removed.

Full `npm test` passes on unmodified base (1,863 spec / 193 unit), exact head (1,863 / 193), and current-base merge preview (1,865 / 193), with docs/builds, UMD/CJS, type/package checks and lint. The exact head contains the new image-link fixture; the merge preview also retains the newer main-branch regression. The preview used unchanged base-lock dependencies and its temporary dependency symlink was removed. All three source checkouts are clean.

This corpus inspects serialized HTML, not browser-repaired DOM, and does not assert exhaustive CommonMark/GFM conformance. The published review is APPROVED at the recorded head; the PR remains open, and neither approval nor successful CI counts as a merge.
