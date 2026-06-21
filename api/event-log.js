/* POST /api/event-log — generic event capture (Survey Submitted, Event
   Registered, Other, …). Match-or-create, log; no Meta fire. */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const body = await readJson(req);
    const { event_type, email, mobile, payload, fbclid, ref, source_channel } = body;
    if (!event_type) return send(res, 400, { error: 'event_type required' });
    if (!email && !mobile) return send(res, 400, { error: 'email or mobile required' });

    const contact = await AT.matchOrCreateContact({ email, mobile, fbclid });
    await AT.logEvent({
      event_type, contactId: contact.id,
      payload: payload || body,
      fbclid, referral_code_used: ref, source_channel,
    });
    return send(res, 200, { success: true, contact_id: contact.contact_id });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
