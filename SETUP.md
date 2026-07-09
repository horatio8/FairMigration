# Campaign platform — setup & go-live

Static site + dependency-free Vercel serverless pipeline: petitions → donations →
referral loop, plus abandoned-cart recovery, A/B SMS, email flows, a signature
counter, reporting, Meta Lead Ads, and rally ticketing. Implements the Farmers
Fightback build spec on the Fair Migration site.

The **code is complete and self-contained** (Node built-ins only — no `npm install`).
Every integration is gated by env vars: unset = feature disabled, nothing crashes.

## Airtable — ✅ done

Base **"Fair Migration — Tracking"** (`app9pnP8DII9lzo2u`, *All Client Database*
workspace) has all tables + fields:

- Core: `Contacts` (+ `sms_opt_out`), `Events`, `Petition Signatures` (+ `lead_source`), `Donations`
- Operational: `Lapse Queue`, `SMS Sends`, `SMS Replies`, `Referral Rollup`, `AB Daily`, `Site Stats`, `Rally Tickets`, `Rally Comp Tokens`

You still create an Airtable **PAT** (`AIRTABLE_API_KEY`); the base id is in `.env.example`.

> Native Meta Lead Ads only (optional phase 10): before enabling `/api/meta-lead-webhook`,
> add these 13 text columns to `Petition Signatures` — `meta_leadgen_id`, `meta_form_id`,
> `meta_form_name`, `meta_ad_id`, `meta_ad_name`, `meta_adset_id`, `meta_adset_name`,
> `meta_campaign_id`, `meta_campaign_name`, `meta_page_id`, `meta_platform`,
> `meta_partner_name`, `meta_created_time`. (The Zapier path via `/api/event-log` needs none of these.)

## API surface (`/api`)

- **Capture:** `petition-signup`, `checkout` (create session + summary + deep-link), `partial`, `event-log`, `stripe-webhook`.
- **Referral loop:** `share-click`, `share-context`, `share-issued`, `share-signup`; `track-redirect` (`/fund`,`/fight`).
- **SMS:** `cellcast-inbound`; enqueue happens inside petition-signup + lapse-sweep.
- **Read/ops:** `signature-count`, `leaderboard`, `ab-report`, `meta-capi`, `meta-lead-webhook`, `youtube`, `admin/env-check`, `admin/stripe-backfill`.
- **Rally:** `rally-checkout` (embedded), `rally-webhook`, `rally-claim`.
- **Cron:** `cron/lapse-sweep` (*/5), `cron/sms-inbound-poll` (hourly), `cron/nightly-rollup` (18:15); callable `cron/sms-queue`, `cron/refresh-signature-count`.

Shared libs (`api/_*.js`): `_airtable`, `_ops`, `_util`, `_stripe`, `_meta`, `_cellcast`, `_cn`, `_rally`.

## What you provide to go live

**Required (phases 1–6):** `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` (set), `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `ADMIN_BASIC_AUTH`. Then:

1. Connect the repo to Vercel; add env vars (Preview + Production); deploy.
2. Stripe → webhook `https://<domain>/api/stripe-webhook` for `checkout.session.completed` + `invoice.paid`.
3. Confirm the domain (assumed `fairmigration.vote`) or set `PRODUCTION_ORIGIN` + `ALLOWED_ORIGINS`.
4. Meta Pixel base snippet sitewide (dedup event_id already wired) — optional.

Donations now flow through **`POST /api/checkout`** (server-side session with
metadata + `client_reference_id`), so no Stripe Payment Link is required. The
donate buttons call it; success returns to `/share.html?session_id=…`.

**Optional bolt-ons** (each: set its env vars, redeploy):
- **SMS** — `CELLCAST_*`; wire the inbound webhook to `/api/cellcast-inbound`. Edit copy/links in `api/_cellcast.js`.
- **Lapse recovery + email** — `CN_*` (4 automations); the `/fund`,`/fight` links are live via `vercel.json` rewrites.
- **Meta Lead Ads** — Zapier → `/api/event-log` (`source:"meta_lead_ad"`, `petition_slug`), or native `/api/meta-lead-webhook` (add the 13 columns above).
- **Rally** — `STRIPE_RALLY_*` on a separate Stripe account + its webhook → `/api/rally-webhook`.
- **YouTube** — `YOUTUBE_CHANNEL_ID`.

## Crons & ops

`vercel.json` declares the three schedules and the `/fund` `/fight` `/leaderboard`
rewrites. Crons run in **production only** and require `CRON_SECRET`. Basic-auth
tools: `/leaderboard`, `/api/ab-report?html=1`, `/api/admin/env-check?live=1`,
`/api/admin/stripe-backfill`.

## Verify after deploy

Run the spec's checklists: sign → Contact+Event+Signature (+SMS Sends row); `?ref=`
→ Share Click; donation with `?client_reference_id=` → Donations row + `petition_slug`;
webhook resend → no dup; abandon → after 30 min lapse-sweep enrols/queues; STOP → `sms_opt_out`.

## Front-end note

The site is the existing polished design-system build (not the reference repo's
`content/site.json` model). All pipeline touchpoints are wired into it:
attribution capture, share beacon, `signPetition()`, `donateCheckout()`,
partial-on-blur, and a live `/api/signature-count` read. Decap CMS / `site.json`
migration was intentionally **not** done — it would replace the working UI.
