# Chromium Trusted Types probe

Independent verification for [Util #809](https://github.com/react-component/util/pull/809), authored head `fd34914bed881cfc51f54d8b10f1c03aa3ca0c0a`, compared with base `993255ed15595875a7004033c3e8f7b892586dea`.

From that Util checkout, with its TypeScript dependency and a Playwright installation, run:

```sh
node /path/to/util-809-trusted-types-browser.cjs /path/to/playwright 993255ed15595875a7004033c3e8f7b892586dea /path/to/chromium
```

Omit the executable argument to use Playwright's matching installed browser. The captured result uses Playwright 1.63.0 and Chromium 151.0.7922.34. The script transpiles the three source modules, serves an actual HTTP CSP (`require-trusted-types-for 'script'; trusted-types 'none'`), and checks initial injection, preexisting-node update, literal CSS text/computed colors, nonce, node reuse and no duplicate styles. A blocked unsafe-setter control confirms that the policy is enforced on both pages. Base fails both operations; the recorded head passes. The probe closes its local server and browser on completion. This is local evidence, separate from upstream CI and approval.
