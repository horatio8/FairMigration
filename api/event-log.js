/* POST /api/event-log — generic event capture (e.g. Zapier Meta lead ads).
   Flexible identity extraction, auto referral code, Meta-lead source tagging,
   and CN receiver push when payload.petition_slug is present. */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const CN = require('./_cn');

// dig identity from top-level → payload.lead_data.* → payload.*
function pick(body, keys) {
  const payload = body.payload || {};
  const lead = payload.lead_data || payload.fields || {};
  for (const k of keys) {
    if (body[k]) return body[k];
    if (lead[k]) return lead[k];
    if (payload[k]) return payload[k];
  }
  return '';
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const body = await readJson(req);
    const event_type = body.event_type || (body.source === 'meta_lead_ad' ? 'Petition Signed' : 'Other');
    const email = pick(body, ['email', 'em']);
    const mobile = pick(body, ['mobile', 'phone', 'ph']);
    if (!email && !mobile) return send(res, 400, { error: 'email or mobile required' });

    const first_name = pick(body, ['first_name', 'fn', 'firstName']);
    const last_name = pick(body, ['last_name', 'ln', 'lastName']);
    const postcode = pick(body, ['postcode', 'zip', 'zp']);
    const source_channel = body.source === 'meta_lead_ad' ? 'Meta Lead' : (body.source_channel || 'Other');

    const contact = await AT.matchOrCreateContact({ first_name, last_name, email, mobile, postcode, fbclid: body.fbclid },
      { first_source_channel: source_channel === 'Meta Lead' ? 'Facebook' : 'Other' });
    const referral_code = await AT.setReferralCodeIfMissing({ id: contact.id, fields: contact.fields });

    await AT.logEvent({
      event_type, contactId: contact.id,
      payload: body.payload || body,
      fbclid: body.fbclid, referral_code_used: body.ref, source_channel,
      curated: { payload: { first_name, last_name, email, mobile, postcode, ref: body.ref,
        lead_source: source_channel === 'Meta Lead' ? 'Meta lead ad' : 'Other',
        campaign: body.petition_slug || (body.payload && body.payload.petition_slug) }, timestamp: AT.nowISO() },
    });

    // push Meta leads onward to the campaign's CN receiver
    const slug = body.petition_slug || (body.payload && body.payload.petition_slug);
    if (slug) CN.pushReceiver(slug, { first_name, last_name, email, mobile, postcode, petition_slug: slug }).catch(() => {});

    return send(res, 200, { success: true, contact_id: contact.contact_id, referral_code });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
