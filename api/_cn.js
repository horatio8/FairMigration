/* Campaign Nucleus — match-or-create profiles, enrol in automations, and push to
   receiver forms. Every call is best-effort and never throws. No-op if unset. */

const API_BASE = process.env.CN_API_BASE || 'https://api.campaignnucleus.com/v1';
function configured() { return !!process.env.CN_API_KEY; }

async function cnFetch(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method, headers: { Authorization: 'Bearer ' + process.env.CN_API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

// { first_name, last_name, email, mobile, postcode, tags?, custom? }
async function matchProfile(input) {
  if (!configured()) return { skipped: true };
  const profile = {
    first_name: input.first_name, last_name: input.last_name, email: input.email,
    mobile: input.mobile, zip: input.postcode,
    tags: input.tags || [], ...(input.custom || {}),
  };
  try {
    let res = await cnFetch('POST', '/profiles/match', profile);
    if (res.status === 405) res = await cnFetch('PUT', '/profiles/match', profile);
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, profile: j };
  } catch (e) { return { error: String(e.message || e) }; }
}

async function enrolAutomation(automationId, input) {
  if (!configured() || !automationId) return { skipped: true };
  try {
    const res = await cnFetch('POST', '/automations/' + automationId + '/profiles', {
      email: input.email, mobile: input.mobile, first_name: input.first_name, last_name: input.last_name, zip: input.postcode,
    });
    return { ok: res.ok };
  } catch (e) { return { error: String(e.message || e) }; }
}

// Push a signup/partial to a per-petition CN receiver form (fire-and-forget).
function receiverUrlFor(slug) {
  let map = {};
  try { map = JSON.parse(process.env.CN_RECEIVER_URLS || '{}'); } catch (e) {}
  return map[slug] || map._default || '';
}
async function pushReceiver(slug, data) {
  const url = receiverUrlFor(slug);
  if (!url) return { skipped: true };
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return { ok: true };
  } catch (e) { return { error: String(e.message || e) }; }
}

// Campaign Nucleus form receiver — accepts a form-encoded POST and maps the
// standard fields (first_name, last_name, email, phone, message). Petition
// signatures are pushed here so CN owns the list + downstream automations.
const PETITION_RECEIVER_URL = process.env.CN_PETITION_RECEIVER_URL
  || 'https://teller.campaignnucleus.com/forms/receiver/27bb41c3-6ec6-40e8-94b0-aede53760830';

async function pushPetitionReceiver({ first_name, last_name, email, phone, message }) {
  if (!email && !phone) return { skipped: 'no_identity' };
  const params = new URLSearchParams();
  if (first_name) params.set('first_name', first_name);
  if (last_name) params.set('last_name', last_name);
  if (email) params.set('email', email);
  if (phone) params.set('phone', phone);
  if (message) params.set('message', message);
  try {
    const res = await fetch(PETITION_RECEIVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) { return { error: String(e.message || e) }; }
}

module.exports = { configured, matchProfile, enrolAutomation, pushReceiver, receiverUrlFor, pushPetitionReceiver };
