# Native Tab / Escape integration evidence — 2026-10-24

AI-assisted source-only reproduction for [Dropdown #273](https://github.com/react-component/dropdown/pull/273), [Menu #899](https://github.com/react-component/menu/pull/899), and [Dropdown #275](https://github.com/react-component/dropdown/pull/275). Results below were observed with actual Chrome click/key input on macOS, not synthetic DOM key dispatch.

| Variant | Focus after clicking Search and pressing Tab |
| --- | --- |
| Base hook control | Next inside panel |
| #273 exact head | Panel wrapper (regression) |
| Temporary Escape-only candidate + #275 guard + Menu #899 | Next inside panel |

In the combined candidate, Escape from the panel returns to Panel actions. Menu actions → Tab → ArrowRight → Child → Escape returns to Submenu without closing the outer Dropdown; a second Escape returns to Menu actions.

**Native Tab advances focus by default.** The earlier jsdom fixture that checks focus remains on the input uses synthetic dispatch and does not execute that default navigation. These are distinct observations, not interchangeable assertions. The panel's click handler stops propagation so clicking Search does not close the Dropdown; this is held constant in all variants.

## Reproduce

Use isolated clean checkouts; the build script checks tracked source and exact HEADs and does not mutate them:

- `react-component/dropdown`: `b22af69306b82d60e64c6f513956564d019fe781` (#273).
- `react-component/menu`: `e00e0c2a5b87dd2b7408156bf68eb808cf672b6f` (#899).

Install the Dropdown checkout's declared dependencies in that isolated checkout, using `--ignore-scripts --package-lock=false --legacy-peer-deps`. Pin the tested top-level runtime versions without changing package.json:

```sh
npm install --no-save --ignore-scripts --package-lock=false --legacy-peer-deps react@19.3.1 react-dom@19.3.1 @rc-component/menu@1.6.0 @rc-component/trigger@3.10.1 @rc-component/portal@2.2.1
```

The builder checks those runtime versions. Use Node 24 and run:

```sh
node build.cjs /path/to/dropdown-273 /path/to/menu-899 /path/to/output
python3 -m http.server 8000 --bind 127.0.0.1 --directory /path/to/output
```

Open `base.html`, `head273.html`, and `escape-only-combined.html` in Chrome. In each: click Panel actions, click Search, press real Tab; inspect focus and the on-page event trace. For the combined candidate, additionally check the Escape sequences above.

The base control replaces only the Dropdown hook with `b4ea62f3293851934d64d9d92cbbd07d87a40dea`; other Dropdown sources and resolved dependencies stay the same. The combined variant uses the included **temporary, uncommitted** hook candidate (Escape capture, other keys bubbling, #275 nested-menu guard), and Menu #899 source. It does not mean #273's author adopted this candidate. The builder aliases a single React instance across source checkouts.

Tested dependency tree: React/ReactDOM19.3.1, Menu1.6.0 for base/head controls, Trigger3.10.1, Portal2.2.1, Node24.15.0. No upstream frozen lockfile was used. Esbuild comes from the resolved Dropdown development dependency tree. These are bounded local integration results, not upstream CI, a merge, an npm release, screen-reader testing, or WCAG conformance. Screenshots remain local; this bundle contains source and a receipt only. Reused Dropdown source is MIT licensed; see LICENSE.
