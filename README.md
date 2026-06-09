# Fair Migration — Campaign Website

Implementation of the **Fair Migration** advocacy homepage (`fairmigration.vote`),
ported from a Claude Design handoff bundle. It is an editorial, conversion-focused
single page anchored on the petition, with a postcode impact map as the engagement hook.

## Structure

- `index.html` — page shell: loads the design-system tokens/styles + bundle, React,
  and the two app scripts. Holds all bespoke layout CSS.
- `app.jsx` — homepage composition: sticky utility bar + header, split editorial hero
  with a live signature ticker, indexed problem blocks, petition + goal thermometer,
  the impact map on a dark stage, manifesto demand, donation tiers, and footer.
- `gistool.jsx` — the Postcode Impact Map: a national state cartogram that drills into
  a local suburb heat-grid, with colour-coded migration intensity, year-on-year change,
  national ranking, and toggleable data layers. Map figures are deterministic **sample
  data** (clearly labelled), ready to swap for live ABS / Home Affairs feeds.
- `_ds/` — the bound **Fair Migration Design System**: design tokens (colors, type,
  spacing, fonts), `styles.css`, and the compiled component bundle (`_ds_bundle.js`,
  exposing `Button`, `PetitionForm`, `Card`, `Badge`, `Input`, `SiteHeader`).
- `assets/` — brand wordmarks, Commonwealth-star favicons, and the hero crowd photo.

## Key interaction

Signing the petition flips the petition card to a thank-you state and, if a valid
4-digit postcode was entered, pushes it into the impact map and scrolls the user there —
turning a signature into an immediate, local view of the issue.

## Running locally

It is a static site. Serve the directory over HTTP (the JSX is transpiled in the
browser via Babel standalone, and the design-system bundle loads as plain JS):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Notes & next steps

The wider brief also calls for an **MP Lookup**, a **Resources hub**, and an
**About/FAQ** page — not yet built. Map data, Stripe donation processing, and the
email-capture integrations are stubbed/labelled and ready to be wired to real services.
