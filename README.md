# Fair Migration — Campaign Website

Implementation of the **Fair Migration** advocacy site (`fairmigration.vote`),
ported from a Claude Design handoff bundle. A conversion-focused, editorial
campaign site anchored on the petition, with a postcode impact map as the
engagement hook.

## Pages

Each top-level menu item is its own page; they all share the header, footer,
signature bar and the petition form.

- `index.html` — Home: hero, signature bar, the problem, the petition (with form), demand.
- `problem.html` — The problem: housing / healthcare / infrastructure pressure blocks.
- `map.html` — Impact map: the postcode GIS tool on a dark stage.
- `petition.html` — Sign: the petition form + live goal thermometer.
- `donate.html` — Donate: giving tiers with a recurring toggle.

## Code structure

- `app.css` — all shared site styles, linked by every page.
- `common.jsx` → `common.js` — the shared module (`window.FM`): the header (with the
  pink **Sign** button + red **Donate** button), footer, signature bar, the **petition
  form** (first name\*, last name\*, email\*, mobile phone, postcode — `*` = required),
  and the reusable content sections.
- `home.jsx`, `problem.jsx`, `map.jsx`, `petition.jsx`, `donate.jsx` → `*.js` — thin
  per-page entry scripts that compose `window.FM` components and mount the page.
- `gistool.jsx` → `gistool.js` — the Postcode Impact Map: a national state cartogram
  that drills into a local suburb heat-grid (intensity, year-on-year change, national
  ranking, toggleable data layers). Figures are deterministic **sample data**, ready to
  swap for live ABS / Home Affairs feeds.
- `_ds/` — the bound **Fair Migration Design System** (tokens + compiled component bundle).
- `assets/` — brand wordmarks, favicons, the hero crowd photo, and vendored React.

## Key interaction

Signing the petition records the signer (persisted in `localStorage`) and, if a
postcode was entered, links straight through to `map.html?pc=…`, which auto-drills
into that suburb — turning a signature into an immediate, local view of the issue.

## Running locally

Fully self-contained static site — no CDN or build step needed to view it.
React/ReactDOM are vendored under `assets/vendor/`, and the JSX is precompiled to
plain JS. Serve the directory over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The `.jsx` files are the source of truth; the matching `.js` files are their compiled
output. If you edit a `.jsx` file, recompile with Babel (`@babel/preset-react` +
`@babel/preset-env`) to regenerate the `.js`.

## Notes & next steps

Map data, Stripe donation processing, and the email-capture integrations are
stubbed/labelled, ready to be wired to real services. The wider brief also mentions an
**MP Lookup**, a **Resources hub**, and an **About/FAQ** page — not yet built.
