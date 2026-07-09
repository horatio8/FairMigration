/* Meta Lead Ads native webhook (alternative to Zapier).
   GET  — subscription verification (hub.challenge).
   POST — X-Hub-Signature-256 verify, fetch each lead, log Petition Signed. */

const { send, readRaw } = require('./_util');
const AT = require('./_airtable');
const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

function verifySig(raw, header) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(String(header));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function fetchLead(leadgenId) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(token)}`);
    return await r.json();
  } catch (e) { return null; }
}

function fromFieldData(fd) {
  const m = {};
  for (const f of (fd || [])) m[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
  return {
    first_name: m.first_name || m.full_name || '', last_name: m.last_name || '',
    email: m.email || '', mobile: m.phone_number || m.phone || '', postcode: m.post_code || m.zip || m.postcode || '',
  };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) { res.statusCode = 200; res.end(challenge || ''); return; }
    res.statusCode = 403; res.end('forbidden'); return;
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const raw = await readRaw(req);
  if (!verifySig(raw, req.headers['x-hub-signature-256'])) return send(res, 401, { error: 'bad signature' });
  let body = {}; try { body = JSON.parse(raw.toString('utf8')); } catch (e) {}

  if (AT.configured()) {
    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'leadgen') continue;
        const v = change.value || {};
        const lead = await fetchLead(v.leadgen_id);
        const id = lead ? fromFieldData(lead.field_data) : {};
        if (!id.email && !id.mobile) continue;
        try {
          const contact = await AT.matchOrCreateContact(id, { first_source_channel: 'Facebook' });
          await AT.setReferralCodeIfMissing({ id: contact.id, fields: contact.fields });
          const meta_event_id = 'petition_' + contact.contact_id + '_' + Date.now();
          await AT.logEvent({
            event_type: 'Petition Signed', contactId: contact.id, source_channel: 'Meta Lead', meta_event_id,
            payload: Object.assign({}, id, { lead_source: 'Meta lead ad' }, v),
            curated: { payload: Object.assign({}, id, {
              lead_source: 'Meta lead ad', meta_leadgen_id: v.leadgen_id, meta_form_id: v.form_id,
              meta_ad_id: v.ad_id, meta_adset_id: v.adgroup_id, meta_campaign_id: v.campaign_id,
              meta_page_id: v.page_id, meta_platform: v.platform, meta_created_time: v.created_time,
            }), timestamp: AT.nowISO() },
          });
        } catch (e) {}
      }
    }
  }
  return send(res, 200, { received: true });
};
