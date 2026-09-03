/* Airtable data layer — REST only (no SDK). Identity ladder, referral codes,
   append-only Events log, and typed fan-out projections. */

const https = require('https');
const crypto = require('crypto');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const T = {
  contacts: process.env.AIRTABLE_CONTACTS_TABLE || 'Contacts',
  events: process.env.AIRTABLE_EVENTS_TABLE || 'Events',
  signatures: process.env.AIRTABLE_PETITION_SIGNATURES_TABLE || 'Petition Signatures',
  donations: process.env.AIRTABLE_DONATIONS_TABLE || 'Donations',
  lapse: process.env.AIRTABLE_LAPSE_TABLE || 'Lapse Queue',
  smsSends: process.env.AIRTABLE_SMS_SENDS_TABLE || 'SMS Sends',
  smsReplies: process.env.AIRTABLE_SMS_REPLIES_TABLE || 'SMS Replies',
  rollup: process.env.AIRTABLE_REFERRAL_ROLLUP_TABLE || 'Referral Rollup',
  abDaily: process.env.AIRTABLE_AB_DAILY_TABLE || 'AB Daily',
  stats: process.env.AIRTABLE_STATS_TABLE || 'Site Stats',
  rallyTickets: process.env.AIRTABLE_RALLY_TICKETS_TABLE || 'Rally Tickets',
  rallyComp: process.env.AIRTABLE_RALLY_COMP_TOKENS_TABLE || 'Rally Comp Tokens',
};
const PROJECTION_TABLES = { 'Petition Signed': T.signatures, 'Donation': T.donations };

const SIGNATURE_BASE_OFFSET = parseInt(process.env.SIGNATURE_BASE_OFFSET || '69500', 10);
const SIGNATURE_MILESTONES = (process.env.SIGNATURE_MILESTONES || '90000,95000,100000')
  .split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);

function configured() { return !!(API_KEY && BASE_ID); }
const uuid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();

/* ---------- low-level REST ----------
   Airtable allows 5 requests/second per base and answers 429 above that. Under a
   burst of signups that ceiling is reached instantly, so every call is retried
   with exponential backoff + jitter (honouring Retry-After) and hard-timed-out,
   and callers treat Airtable as best-effort — never as the capture of record. */
const AT_TIMEOUT_MS = parseInt(process.env.AIRTABLE_TIMEOUT_MS || '8000', 10);
const AT_RETRIES = parseInt(process.env.AIRTABLE_RETRIES || '3', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function atRequestOnce(method, table, { recordId, query, body } = {}) {
  return new Promise((resolve, reject) => {
    let path = '/v0/' + encodeURIComponent(BASE_ID) + '/' + encodeURIComponent(table);
    if (recordId) path += '/' + recordId;
    if (query) path += '?' + query;
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.airtable.com', path, method, timeout: AT_TIMEOUT_MS,
      headers: Object.assign({ Authorization: 'Bearer ' + API_KEY },
        data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = {}; try { json = text ? JSON.parse(text) : {}; } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
        const err = new Error('Airtable ' + res.statusCode + ': ' + text.slice(0, 300));
        err.status = res.statusCode;
        err.retryAfterMs = parseInt(res.headers['retry-after'] || '0', 10) * 1000;
        reject(err);
      });
    });
    req.on('timeout', () => { const e = new Error('Airtable timeout'); e.status = 0; req.destroy(e); });
    req.on('error', (e) => { if (!e.status) e.status = 0; reject(e); });
    if (data) req.write(data);
    req.end();
  });
}

// 429 (rate limit), 5xx and network errors are transient — back off and retry.
const isTransient = (e) => !e.status || e.status === 429 || e.status >= 500;

async function atRequest(method, table, opts = {}) {
  let last;
  for (let attempt = 0; attempt <= AT_RETRIES; attempt++) {
    try { return await atRequestOnce(method, table, opts); } catch (e) {
      last = e;
      if (attempt === AT_RETRIES || !isTransient(e)) break;
      const base = e.retryAfterMs || Math.min(4000, 300 * Math.pow(2, attempt));
      await sleep(base + Math.floor(Math.random() * 250)); // jitter avoids thundering herd
    }
  }
  throw last;
}

const esc = (s) => String(s).replace(/'/g, "\\'");
async function findOne(table, formula) {
  const q = 'filterByFormula=' + encodeURIComponent(formula) + '&maxRecords=1';
  const r = await atRequest('GET', table, { query: q });
  return r.records && r.records[0] ? r.records[0] : null;
}
async function createRecord(table, fields) {
  const r = await atRequest('POST', table, { body: { records: [{ fields }], typecast: true } });
  return r.records[0];
}
async function updateRecord(table, id, fields) {
  const r = await atRequest('PATCH', table, { body: { records: [{ id, fields }], typecast: true } });
  return r.records[0];
}

/* ---------- normalization ---------- */
const normEmail = (e) => (e ? String(e).trim().toLowerCase() : '');
function normPhoneAU(p) {
  if (!p) return '';
  let d = String(p).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return '+' + d.slice(1).replace(/\D/g, '');
  d = d.replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 10) return '+61' + d.slice(1);      // 04xx / 0x → +61
  if (d.startsWith('61')) return '+' + d;
  if (d.length === 9) return '+61' + d;                                     // missing leading 0
  return d ? '+' + d : '';
}

/* ---------- referral codes (Crockford, no 0/O/1/I/L) ---------- */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
function genCode(len = 6) {
  let s = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return s;
}
/* Codes are generated locally — no lookup — so a signup costs one less Airtable
   request on the hot path. 9 chars over a 30-char alphabet is 2.19e13 codes: at
   1M supporters the expected number of collisions is ~0.02. Set
   REFERRAL_CODE_VERIFY=1 to re-enable the (rate-limit-costly) uniqueness probe. */
const CODE_LEN = parseInt(process.env.REFERRAL_CODE_LEN || '9', 10);
async function uniqueCode() {
  if (process.env.REFERRAL_CODE_VERIFY !== '1') return genCode(CODE_LEN);
  for (let i = 0; i < 6; i++) {
    const code = genCode(CODE_LEN);
    const hit = await findOne(T.contacts, `{referral_code} = '${esc(code)}'`);
    if (!hit) return code;
  }
  return genCode(CODE_LEN + 1);
}

/* ---------- identity ladder ---------- */
async function findContact({ email, mobile, first_name, last_name, postcode }) {
  const e = normEmail(email), m = normPhoneAU(mobile);
  if (e) { const r = await findOne(T.contacts, `LOWER({email}) = '${esc(e)}'`); if (r) return r; }
  if (m) { const r = await findOne(T.contacts, `{mobile} = '${esc(m)}'`); if (r) return r; }
  if (first_name && last_name && postcode) {
    const f = String(first_name).trim().toLowerCase(), l = String(last_name).trim().toLowerCase();
    const r = await findOne(T.contacts, `AND(LOWER({first_name})='${esc(f)}', LOWER({last_name})='${esc(l)}', {postcode}='${esc(postcode)}')`);
    if (r) return r;
  }
  return null;
}

// Match-or-create with first-touch preservation and empty-field backfill.
async function matchOrCreateContact(input, opts = {}) {
  const e = normEmail(input.email), m = normPhoneAU(input.mobile);
  const existing = await findContact(input);
  if (existing) {
    const f = existing.fields || {};
    const patch = {};
    const backfill = { first_name: input.first_name, last_name: input.last_name, email: e, mobile: m,
      postcode: input.postcode, fbp: input.fbp };
    for (const k in backfill) { if (backfill[k] && !f[k]) patch[k] = backfill[k]; }
    if (input.fbclid && !f.fbclid) patch.fbclid = input.fbclid;          // first-touch only
    if (opts.first_source_channel && !f.first_source_channel) patch.first_source_channel = opts.first_source_channel;
    patch.last_updated = nowISO();
    const updated = await updateRecord(T.contacts, existing.id, patch);
    return { id: existing.id, fields: updated.fields, contact_id: f.contact_id, isNew: false };
  }
  // Callers may pre-generate identity (so a response is valid even if Airtable
  // is throttled) and pass it in, keeping the two in sync.
  const contact_id = opts.contact_id || uuid();
  const fields = {
    contact_id, first_name: input.first_name || '', last_name: input.last_name || '',
    email: e, mobile: m, postcode: input.postcode || '',
    fbclid: input.fbclid || '', fbp: input.fbp || '',
    referral_code: opts.referral_code || await uniqueCode(),
    first_source_channel: opts.first_source_channel || 'Direct',
    status: opts.status || 'Signatory Only',
    date_first_seen: nowISO(), last_updated: nowISO(),
  };
  const rec = await createRecord(T.contacts, fields);
  bumpSignatureCount().catch(() => {});   // new supporter → signature counter
  return { id: rec.id, fields: rec.fields, contact_id, isNew: true };
}

async function setReferralCodeIfMissing(contact) {
  if (contact.fields && contact.fields.referral_code) return contact.fields.referral_code;
  const code = await uniqueCode();
  await updateRecord(T.contacts, contact.id, { referral_code: code });
  return code;
}

async function resolveReferrerByCode(code) {
  if (!code) return null;
  return findOne(T.contacts, `{referral_code} = '${esc(String(code).trim())}'`);
}

// Combine status as roles accumulate.
async function bumpStatus(contact, role) {
  const cur = (contact.fields && contact.fields.status) || '';
  const isSig = role === 'signatory', isDon = role === 'donor';
  let next = cur;
  if (cur === 'Signatory + Donor') next = cur;
  else if (!cur || cur === 'Inactive') next = isDon ? 'Donor Only' : 'Signatory Only';
  else if (cur === 'Signatory Only' && isDon) next = 'Signatory + Donor';
  else if (cur === 'Donor Only' && isSig) next = 'Signatory + Donor';
  if (next !== cur) { try { await updateRecord(T.contacts, contact.id, { status: next }); } catch (e) {} }
}

/* ---------- events + fan-out ---------- */
async function projectFanout(eventRec, eventType, contactId, curated) {
  const target = PROJECTION_TABLES[eventType];
  if (!target) return { fanout_status: 'No Typed Table' };
  try {
    const base = { event: [eventRec.id], contact: contactId ? [contactId] : undefined,
      timestamp: curated.timestamp || nowISO(), payload: JSON.stringify(curated.payload || {}) };
    let fields;
    if (eventType === 'Petition Signed') {
      const p = curated.payload || {};
      fields = Object.assign({ signature_id: uuid(), first_name: p.first_name, last_name: p.last_name,
        email: p.email, mobile: p.mobile, postcode: p.postcode, country: p.country || 'Australia',
        campaign: p.campaign || p.content_name, consent: p.consent !== false,
        fbclid: p.fbclid, fbp: p.fbp, ref_used: p.ref,
        utm_source: p.utm_source, utm_medium: p.utm_medium, utm_campaign: p.utm_campaign,
        utm_term: p.utm_term, utm_content: p.utm_content,
        lead_source: p.lead_source || 'Web form',
        meta_leadgen_id: p.meta_leadgen_id, meta_form_id: p.meta_form_id, meta_form_name: p.meta_form_name,
        meta_ad_id: p.meta_ad_id, meta_ad_name: p.meta_ad_name, meta_adset_id: p.meta_adset_id, meta_adset_name: p.meta_adset_name,
        meta_campaign_id: p.meta_campaign_id, meta_campaign_name: p.meta_campaign_name, meta_page_id: p.meta_page_id,
        meta_platform: p.meta_platform, meta_partner_name: p.meta_partner_name, meta_created_time: p.meta_created_time }, base);
    } else if (eventType === 'Donation') {
      const p = curated.donation || {};
      fields = Object.assign({ donation_id: uuid(), amount_cents: p.amount_cents, amount: (p.amount_cents || 0) / 100,
        currency: p.currency, stripe_object_type: p.stripe_object_type, stripe_object_id: p.stripe_object_id,
        stripe_payment_intent: p.stripe_payment_intent, email: p.email, name: p.name, phone: p.phone,
        postcode: p.postcode, country: p.country, content_name: p.content_name, source_url: p.source_url,
        fbclid: p.fbclid, fbp: p.fbp, petition_slug: p.petition_slug }, base);
    }
    const rec = await createRecord(target, fields);
    return { fanout_status: 'Fanned Out', projectionId: rec.id };
  } catch (err) {
    return { fanout_status: 'Failed', fanout_error: String(err.message || err).slice(0, 250) };
  }
}

async function logEvent({ event_type, contactId, payload, fbclid, referral_code_used, source_channel, meta_event_id, curated }) {
  const fields = {
    event_id: uuid(), event_type, timestamp: nowISO(),
    payload: JSON.stringify(payload || {}),
    fbclid: fbclid || '', referral_code_used: referral_code_used || '',
    source_channel: source_channel || '', meta_event_id: meta_event_id || '',
  };
  if (contactId) fields.contact = [contactId];
  const rec = await createRecord(T.events, fields);
  const fo = await projectFanout(rec, event_type, contactId, curated || { payload, timestamp: fields.timestamp });
  // Only spend a request writing the status back when something actually went
  // wrong — the happy path saves one Airtable call per event.
  if (fo.fanout_status && fo.fanout_status !== 'Fanned Out') {
    try { await updateRecord(T.events, rec.id, { fanout_status: fo.fanout_status, fanout_error: fo.fanout_error || '' }); } catch (e) {}
  }
  return rec;
}

async function logEventIdempotent(args) {
  if (args.meta_event_id) {
    const hit = await findOne(T.events, `{meta_event_id} = '${esc(args.meta_event_id)}'`);
    if (hit) return { record: hit, duplicate: true };
  }
  const rec = await logEvent(args);
  return { record: rec, duplicate: false };
}

/* ---------- hashing + deterministic A/B ---------- */
const sha256hex = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const phoneHash = (e164) => sha256hex(String(e164 || ''));
function abVariant(seed) {
  const forced = (process.env.AB_FORCE_VARIANT || 'off').toUpperCase();
  if (forced === 'A' || forced === 'B') return forced;
  const h = sha256hex(String(seed || ''));
  return parseInt(h.slice(-1), 16) % 2 === 0 ? 'A' : 'B';
}

/* ---------- Site Stats + signature counter ---------- */
// Warm-lambda cache of stat record ids, so setStat is one PATCH not a lookup+PATCH.
const statIdCache = Object.create(null);
async function getStat(key) {
  const r = await findOne(T.stats, `{key} = '${esc(key)}'`);
  if (r) statIdCache[key] = r.id;
  return r ? { id: r.id, num: Number(r.fields.num_value) || 0 } : null;
}
async function setStat(key, num) {
  const fields = { num_value: num, updated_at: nowISO() };
  if (statIdCache[key]) {
    try { return await updateRecord(T.stats, statIdCache[key], fields); } catch (e) { delete statIdCache[key]; }
  }
  const r = await findOne(T.stats, `{key} = '${esc(key)}'`);
  if (r) { statIdCache[key] = r.id; return updateRecord(T.stats, r.id, fields); }
  const created = await createRecord(T.stats, Object.assign({ key }, fields));
  if (created) statIdCache[key] = created.id;
  return created;
}

/* Per-signup estimate only. A read-modify-write counter loses updates when
   signups land concurrently, so /api/cron/refresh-signature-count re-derives the
   true number from Contacts on a schedule. Set SIGNATURE_COUNT_MODE=cron to skip
   the per-signup bump entirely under heavy load and let the cron own the number
   (saves 2-3 Airtable requests per signature). */
async function bumpSignatureCount(by = 1) {
  if (process.env.SIGNATURE_COUNT_MODE === 'cron') return null;
  const cur = await getStat('signature_count');
  const before = cur ? cur.num : 0;
  const after = before + by;
  await setStat('signature_count', after);
  // milestone crossing on the public number
  const publicBefore = before + SIGNATURE_BASE_OFFSET, publicAfter = after + SIGNATURE_BASE_OFFSET;
  for (const m of SIGNATURE_MILESTONES) {
    if (publicBefore < m && publicAfter >= m) {
      logEvent({ event_type: 'Milestone Crossed', payload: { milestone: m, count: publicAfter } }).catch(() => {});
      const hook = process.env.MILESTONE_WEBHOOK_URL;
      if (hook) { try { fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ milestone: m, count: publicAfter }) }); } catch (e) {} }
    }
  }
  return after;
}
function publicSignatureCount(raw) {
  let n = raw + SIGNATURE_BASE_OFFSET;
  const round = parseInt(process.env.SIGNATURE_ROUND_DOWN_TO || '0', 10);
  if (round > 0) n = Math.floor(n / round) * round;
  return n;
}

module.exports = {
  configured, uuid, nowISO, normEmail, normPhoneAU, esc, genCode, uniqueCode,
  matchOrCreateContact, setReferralCodeIfMissing, resolveReferrerByCode, bumpStatus,
  findOne, createRecord, updateRecord, logEvent, logEventIdempotent, T,
  sha256hex, phoneHash, abVariant, getStat, setStat, bumpSignatureCount, publicSignatureCount,
  SIGNATURE_BASE_OFFSET, SIGNATURE_MILESTONES,
};
