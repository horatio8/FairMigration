/* GET /api/share-context?session_id=cs_… or ?email=… — resolve the donor for
   the /share page. 404 while the webhook hasn't landed yet (client polls). */

const { applyCors, send } = require('./_util');
const { stripeGet } = require('./_stripe');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const url = new URL(req.url, 'http://x');
    const session_id = url.searchParams.get('session_id');
    let email = url.searchParams.get('email');
    let petition_slug = '';

    if (session_id) {
      try {
        const s = await stripeGet('checkout/sessions/' + session_id);
        email = (s.customer_details && s.customer_details.email) || s.customer_email || email;
        petition_slug = s.client_reference_id || '';
      } catch (e) { /* fall through to 404 */ }
    }
    if (!email) return send(res, 404, { error: 'not_found' });

    const rec = await AT.findOne(AT.T.contacts, `LOWER({email}) = '${String(email).trim().toLowerCase().replace(/'/g, "\\'")}'`);
    if (!rec) return send(res, 404, { error: 'not_found' });

    const code = await AT.setReferralCodeIfMissing(rec);
    return send(res, 200, {
      contact_id: rec.fields.contact_id, referral_code: code,
      first_name: rec.fields.first_name || '', petition_slug,
    });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
