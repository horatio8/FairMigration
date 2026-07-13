/* Meta Conversions API (server-side) — SHA-256 hashed PII, deduped with the
   browser Pixel via a shared event_id. No-op if env not configured. */

const https = require('https');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_TEST_EVENT_CODE;

const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const norm = (v) => (v == null ? '' : String(v).trim().toLowerCase());
const hash = (v) => { const n = norm(v); return n ? sha256(n) : undefined; };
const hashPhone = (v) => { const d = String(v || '').replace(/[\s\-()+]/g, '').replace(/\D/g, ''); return d ? sha256(d) : undefined; };

function userData({ email, phone, first_name, last_name, postcode, city, state, country, external_id, fbp, fbc, fbclid, ip, ua }) {
  const ud = {};
  if (email) ud.em = [hash(email)];
  if (phone) ud.ph = [hashPhone(phone)];
  if (first_name) ud.fn = [hash(first_name)];
  if (last_name) ud.ln = [hash(last_name)];
  if (postcode) ud.zp = [hash(postcode)];
  if (city) ud.ct = [hash(city)];
  if (state) ud.st = [hash(state)];
  if (country) ud.country = [hash(country)];
  if (external_id) ud.external_id = [sha256(norm(external_id))];
  if (fbp) ud.fbp = fbp;
  let fbcVal = fbc;
  if (!fbcVal && fbclid) fbcVal = 'fb.1.' + Date.now() + '.' + fbclid;
  if (fbcVal) ud.fbc = fbcVal;
  if (ip) ud.client_ip_address = ip;
  if (ua) ud.client_user_agent = ua;
  return ud;
}

function sendEvent({ event_name, event_id, event_source_url, action_source = 'website', user, custom_data }) {
  return new Promise((resolve) => {
    if (!PIXEL_ID || !CAPI_TOKEN) { resolve({ skipped: true }); return; }
    const body = {
      data: [{
        event_name, event_time: Math.floor(Date.now() / 1000), event_id,
        action_source, event_source_url,
        user_data: userData(user || {}),
        custom_data: custom_data || {},
      }],
    };
    if (TEST_CODE) body.test_event_code = TEST_CODE;
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: '/v19.0/' + PIXEL_ID + '/events?access_token=' + encodeURIComponent(CAPI_TOKEN),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => { let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {} resolve(j); });
    });
    req.on('error', (e) => resolve({ error: String(e.message || e) }));
    req.write(data); req.end();
  });
}

// Non-secret diagnostic: which Meta env is present, and whether events are being
// tagged as test events (which keeps them OUT of production ads reporting).
function configStatus() {
  return { pixel_id_set: !!PIXEL_ID, capi_token_set: !!CAPI_TOKEN, test_event_code_active: !!TEST_CODE };
}

module.exports = { sendEvent, userData, configStatus };
