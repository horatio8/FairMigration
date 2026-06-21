/* POST /api/share-signup — unknown user on /share. Match-or-create, ensure a
   referral code, return it. Contact creation IS the event (none logged). */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const { first_name, last_name, email, mobile, postcode } = await readJson(req);
    if (!first_name || !last_name || !email) return send(res, 400, { error: 'first_name, last_name and email are required' });
    const contact = await AT.matchOrCreateContact({ first_name, last_name, email, mobile, postcode });
    const referral_code = await AT.setReferralCodeIfMissing({ id: contact.id, fields: contact.fields });
    return send(res, 200, { success: true, contact_id: contact.contact_id, referral_code, first_name: contact.fields.first_name || first_name });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
