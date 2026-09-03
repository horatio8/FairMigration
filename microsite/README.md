# Fair Migration — microsite (landing + share)

A lightweight secondary site: a single-page petition **landing** (`index.html`) and a
**share** page (`share.html`). Same brand, same content, same petition — signatures flow
into the same Airtable/Meta pipeline as the main site.

It loads the brand (CSS, React, design system, `common.js`, `share.js`) and images from the
main site (`https://www.fairmigration.vote`) and posts to the main petition API, configured
via `window.FM_CONFIG` in each HTML file:

- `apiBase` / `assetBase` → the main site (so the microsite stays in sync with the brand).
- `origin` → `window.location.origin` (referral links point back at the microsite).
- `sharePath: '/'`, `afterSignUrl: 'share.html'`, `signHref: '#sign'`, `minimalChrome: true`.

## Deploy

Deploy this `microsite/` folder as its own site (e.g. a new Vercel project with root
directory `microsite/`, or any static host) on the microsite's domain.

**One required step for the shared petition API (CORS):** add the microsite's domain to the
`ALLOWED_ORIGINS` env var on the **main** Vercel project (comma-separated), then redeploy the
main project. `*.vercel.app` preview domains are already allowed out of the box.
