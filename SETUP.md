# Tracking system — setup & go-live

Petition → Donation → Referral tracking, per the spec. Stack: **Vercel** (static
site + serverless `/api`) · **Airtable** (data) · **Stripe** (payments) ·
**Meta Conversions API** (attribution).

The **code is complete**. What remains is provisioning external accounts and
pasting credentials. Nothing below requires more code from us unless noted.

## What's built

**Serverless API (`/api`, zero npm deps — Node built-ins only)**
- `petition-signup.js` — match-or-create, referral attribution, `Petition Signed` event → `Petition Signatures`, Meta `Lead`.
- `stripe-webhook.js` — manual HMAC verify on raw body, idempotent `Donation` event → `Donations`, Meta `Purchase`. Skips subscription checkout (handled by `invoice.paid`).
- `share-signup.js`, `share-context.js`, `share-issued.js`, `share-click.js` — referral loop.
- `event-log.js` — generic capture.
- Shared: `_airtable.js` (identity ladder, referral codes, fan-out), `_meta.js` (CAPI + SHA-256), `_stripe.js` (HMAC + REST), `_util.js` (CORS/body).

**Frontend (wired in `common.js` / `share.js`)**
- Attribution capture (UTMs, `fbclid`, `_fbp`, `ref`, landing) → `sessionStorage`.
- `?ref=` Share Click beacon (once per ref per session).
- Petition form → `POST /api/petition-signup`, persists `ff_referral_code` / `ff_contact_id`, fires browser Pixel `Lead` with the shared `event_id`. Falls back gracefully (UI still flips) if the API is unreachable.
- Donate CTA appends `?client_reference_id=<slug>` when a Stripe Payment Link is configured.
- `/share` page — polling / ask-identity / ready states + 6 share buttons.
- OG tags (absolute, 2340×866) on every public page.

## What I need from you

1. **Airtable** — a base with tables `Contacts`, `Events`, `Petition Signatures`,
   `Donations` (fields per the spec). I can create this for you via the connected
   Airtable integration if you point me at a workspace — otherwise create it and
   send `AIRTABLE_BASE_ID` + a personal access token.
2. **Stripe** — `STRIPE_SECRET_KEY` (restricted: read Checkout Sessions, Customers,
   Invoices, Subscriptions), a webhook subscribed to `checkout.session.completed`
   and `invoice.paid` → `STRIPE_WEBHOOK_SECRET`, plus your Payment Link URL.
3. **Meta** (optional but recommended) — `META_PIXEL_ID`, `META_CAPI_TOKEN`.
4. **Vercel** — connect this repo as a project; add the env vars (Production +
   Preview); deploy. Confirm the production domain (assumed `fairmigration.vote`).

Set everything from `.env.example`. **Redeploy after adding env vars.**

## Dashboard steps (you, in each console)

- **Stripe → Payment Link → After payment → Redirect:**
  `https://<domain>/share.html?session_id={CHECKOUT_SESSION_ID}`
- **Stripe → Developers → Webhooks → Add endpoint:**
  `https://<domain>/api/stripe-webhook`, events `checkout.session.completed`, `invoice.paid`.
- **Frontend config (if not on `fairmigration.vote`)** — set before `common.js` loads:
  ```html
  <script>window.FM_CONFIG = { origin: "https://YOURDOMAIN", petitionSlug: "fair-migration", stripePaymentLink: "https://buy.stripe.com/…" };</script>
  ```
- **Browser Pixel** — add your Meta Pixel base snippet sitewide; the petition form
  already fires `Lead` with the server `event_id` for dedup. Add `Purchase` on the
  `/share` success path if you want browser-side purchase too.

## Verify (per the spec's checklist)

Run §11 of the spec after deploy: new sign → Contact + Event + Signature; repeat
email → reuse Contact, first-touch preserved; `?ref=` → Share Click; sign after
`?ref=` → Share Conversion + `referred_by`; real donation with
`?client_reference_id=` → Donation row with `petition_slug`; webhook resend → no
dupe; `/share?session_id=…` → correct share link; Meta Events Manager dedup.
