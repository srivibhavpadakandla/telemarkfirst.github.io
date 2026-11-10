# Public FLL testing site

URL: https://telemark-fll-preview.alex-xu202208.chatgpt.site

Sites project ID: `appgprj_6af0df108aa881918e0e4b183907a31e`

This is a temporary, public snapshot of the FLL curriculum and simulators. It is separate from `telemarkfirst.github.io`. The preview includes the FLL lessons, shared browser assets, Pyodide runtime, and SPIKE Prime robot model. The older FTC courses and large FTC model files are outside this preview's scope.

The preview build uses `TELEMARK_PREVIEW_SITE=1`, `TELEMARK_BASE_URL=/`, and `TELEMARK_URL` set to the URL above. This adds a visible testing banner and `noindex` metadata, removes the live-site sign-in and analytics controls, and keeps progress in each visitor's browser. The local Markdown editing tool is absent from the production build.

The deployed Sites source repository contains the generated static output in `dist/`. The Telemark workspace remains the source of truth. Local changes do not update the public preview automatically; rebuild and publish a new Sites version to refresh it. The Site has no automatic expiration, so change its access or retire it when testing ends.

Version 1 was published on November 8, 2026. The production Docusaurus build, `npm run typecheck`, and `npm run test:site` passed. The public root, FLL capstone page, robot model, and Pyodide WebAssembly asset returned HTTP 200 after deployment.
