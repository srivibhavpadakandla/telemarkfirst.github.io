# Telemark dependency review — November 9, 2026

Compatible lockfile fixes were applied with npm audit fix, without forced
framework downgrades or major-version overrides. Firebase was refreshed from
12.10.0 to 12.19.0 within the existing declared range.

Production audit before: info: 0, low: 4, moderate: 13, high: 20, critical: 18, total: 55.

Production audit after: info: 0, low: 3, moderate: 7, high: 5, critical: 15, total: 30.

These are affected package counts, including inherited findings in parent
packages; they are not counts of independent exploitable application defects.
Remaining paths include the Docusaurus build/dev-server toolchain and Firebase's
pinned grpc-js dependency. The current registry report proposes a Docusaurus
3.7.0 downgrade and Firebase 9.14.0 downgrade for some paths. Neither was applied.
Latest Docusaurus 3.10.2 is also included in the affected ranges reported by npm.
A future fix should evaluate patched upstream versions or narrowly scoped
overrides with compatibility tests rather than accept those downgrades.

## Remaining affected packages

| Package | Highest severity |
| --- | --- |
| @docusaurus/bundler | moderate |
| @docusaurus/core | critical |
| @docusaurus/plugin-content-blog | critical |
| @docusaurus/plugin-content-docs | critical |
| @docusaurus/plugin-content-pages | critical |
| @docusaurus/plugin-css-cascade-layers | critical |
| @docusaurus/plugin-debug | critical |
| @docusaurus/plugin-google-analytics | critical |
| @docusaurus/plugin-google-gtag | critical |
| @docusaurus/plugin-google-tag-manager | critical |
| @docusaurus/plugin-sitemap | critical |
| @docusaurus/plugin-svgr | critical |
| @docusaurus/preset-classic | critical |
| @docusaurus/theme-classic | critical |
| @docusaurus/theme-search-algolia | critical |
| @firebase/firestore | high |
| @firebase/firestore-compat | high |
| @grpc/grpc-js | high |
| @svgr/plugin-svgo | low |
| @svgr/webpack | low |
| copy-webpack-plugin | moderate |
| css-minimizer-webpack-plugin | moderate |
| deepmerge | low |
| firebase | high |
| qs | moderate |
| serialize-javascript | high |
| sockjs | moderate |
| tinypool | critical |
| uuid | moderate |
| webpack-dev-server | moderate |

## Underlying advisory references

- [@grpc/grpc-js: In certain configurations, getAuthContext can return unauthorized certificates as though they were authorized](https://github.com/advisories/GHSA-m9gg-hp2v-232j) — high; affected range: `<1.13.6`.
- [@grpc/grpc-js: The server transmits some error messages thrown by method handlers to the client in status messages](https://github.com/advisories/GHSA-f596-whhp-79r4) — low; affected range: `<1.13.6`.
- [deepmerge mergeObject() allows prototype poisoning of returned objects](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) — low; affected range: `>=4.2.0 <=4.3.1`.
- [qs has a remotely triggerable DoS: qs.stringify crashes with TypeError on null/undefined entries in comma-format arrays when encodeValuesOnly is set](https://github.com/advisories/GHSA-q8mj-m7cp-5q26) — moderate; affected range: `>=6.11.1 <=6.15.1`.
- [qs array-limit bypass via bracket-key comma parsing](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) — moderate; affected range: `>=6.14.2 <=6.15.3`.
- [qs: Denial of Service via Attacker Controlled isBuffer](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) — moderate; affected range: `>=2.2.5 <6.16.0`.
- [qs : qs.stringify with arrayFormat 'comma' throws an uncaught TypeError on array elements carrying a non-callable own toString (DoS)](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) — moderate; affected range: `>=6.7.0 <=6.16.0`.
- [Serialize JavaScript is Vulnerable to RCE via RegExp.flags and Date.prototype.toISOString()](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) — high; affected range: `<=7.0.2`.
- [Serialize JavaScript has CPU Exhaustion Denial of Service via crafted array-like objects](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) — moderate; affected range: `>=5.0.0 <7.0.5`.
- [Serialize JavaScript: Cross-site scripting (XSS) via unescaped </script at the end of a serialized function body](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) — low; affected range: `<7.1.3`.
- [Tinypool: Prototype Pollution gadget in worker options leads to Remote Code Execution](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) — critical; affected range: `<=2.1.0`.
- [Tinypool: Prototype Pollution Gadget to RCE in run() options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) — critical; affected range: `<2.1.2`.
- [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — moderate; affected range: `<11.1.1`.

## Verification

A fresh isolated `npm ci --ignore-scripts`, `npm run typecheck`,
`npm run test:site`, and `npm run build` completed successfully. Headed Chromium
replayed the tutor recovery fixture and actual local FLL Python route after the
refresh. The feature checks are described in README.md. Reproduce the security report with
`npm audit --omit=dev`; audit results can change as advisories are updated.
