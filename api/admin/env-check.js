/* GET /api/admin/env-check (basic-auth) — which env vars are set; ?live=1 pings
   each integration lightly. Never leaks secret values. */

const { send, requireBasicAuth } = require('../_util');

const GROUPS = {
  core: ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CRON_SECRET', 'ADMIN_BASIC_AUTH'],
  meta: ['META_PIXEL_ID', 'META_CAPI_TOKEN', 'META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN', 'META_WEBHOOK_VERIFY_TOKEN'],
  cellcast: ['CELLCAST_API_KEY', 'CELLCAST_FROM', 'CELLCAST_API_BASE', 'CELLCAST_WEBHOOK_BASIC', 'CELLCAST_FORWARD_URL'],
  cn: ['CN_API_KEY', 'CN_API_BASE', 'CN_RECEIVER_URLS', 'CN_AUTOMATION_PETITION_LAPSE_A', 'CN_AUTOMATION_PETITION_LAPSE_B', 'CN_AUTOMATION_DONATION_LAPSE_A', 'CN_AUTOMATION_DONATION_LAPSE_B'],
  rally: ['STRIPE_RALLY_SECRET_KEY', 'STRIPE_RALLY_PUBLISHABLE_KEY', 'STRIPE_RALLY_WEBHOOK_SECRET', 'STRIPE_RALLY_ADULT_PRICE_ID', 'STRIPE_RALLY_KID_PRICE_ID', 'RALLY_SUCCESS_URL_BASE'],
  misc: ['SIGNATURE_BASE_OFFSET', 'SIGNATURE_MILESTONES', 'MILESTONE_WEBHOOK_URL', 'PRODUCTION_ORIGIN', 'ALLOWED_ORIGINS', 'VERCEL_ENV'],
};

module.exports = async (req, res) => {
  if (!requireBasicAuth(req, res)) return;
  const url = new URL(req.url, 'http://x');
  const present = {};
  for (const g in GROUPS) { present[g] = {}; for (const k of GROUPS[g]) present[g][k] = !!process.env[k]; }

  const out = { env: process.env.VERCEL_ENV || 'unknown', present };

  if (url.searchParams.get('live') === '1') {
    out.live = {};
    // Airtable
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      try {
        const r = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_CONTACTS_TABLE || 'Contacts')}?maxRecords=1`,
          { headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_API_KEY } });
        out.live.airtable = r.status;
      } catch (e) { out.live.airtable = String(e.message || e); }
    }
    // Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try { const r = await fetch('https://api.stripe.com/v1/balance', { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } }); out.live.stripe = r.status; } catch (e) { out.live.stripe = String(e.message || e); }
    }
  }
  return send(res, 200, out);
};
