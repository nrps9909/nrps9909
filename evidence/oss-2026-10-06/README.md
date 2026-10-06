# Payload #17744 merged locale contract

The PR was merged by sling-figma at `2026-10-05T16:22:40Z`. Final authored head is `86d62f8cbdb08ffb5f34c2dcb0808d68630ae99a`; the verified squash commit is `282140bbaf38a554b28c7a8cb42280555bf26eca`, with parent `5cb7b3116474307aafba2ba3ac3aed8ce4203404`.

The merged file differs from the prior tested head only by two preserved upstream additions (`general.skipToContent`, `hierarchy.searchResults`). The audit checks all 673 keys, the original 23 corrected values, every interpolation/markup token, and all unchanged values. This is a locale contract audit. The prior 15 utility tests remain evidence at their original October 3 head; they were not rerun on the squash commit. Remote authored-head CI has 280 successful and 5 skipped checks, and its `ci` workflow succeeds on attempt 2.

To reproduce with Node 24 and a public upstream clone containing the four revisions:

```sh
locale_path=packages/translations/src/languages/zhTw.ts
git show 15d051b5613d79293f607eab4b1a7e535b75b138:$locale_path > tested-base.ts
git show 86d62f8cbdb08ffb5f34c2dcb0808d68630ae99a:$locale_path > tested-head.ts
git show 5cb7b3116474307aafba2ba3ac3aed8ce4203404:$locale_path > merge-parent.ts
git show 282140bbaf38a554b28c7a8cb42280555bf26eca:$locale_path > merged.ts
node payload-zhtw-merge-audit.mjs tested-base.ts tested-head.ts merge-parent.ts merged.ts result.json
```

No browser rendering, screen-reader output or WCAG conformance claim is made. The probe was developed with AI assistance and checked against the exact GitHub blobs.
