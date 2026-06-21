/* POST /api/share-click — beacon on every page load that has ?ref=.
   Log a Share Click on the referrer's contact. Client dedups once-per-session. */

const { applyCors, send, readJson, clientIp } = require('./_util');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const { ref, source_url, fbclid } = await readJson(req);
    if (!ref) return send(res, 400, { error: 'ref required' });
    const referrer = await AT.resolveReferrerByCode(ref);
    if (!referrer) return send(res, 404, { error: 'referrer not found' });
    await AT.logEvent({
      event_type: 'Share Click', contactId: referrer.id,
      payload: { source_url, ip: clientIp(req), ua: req.headers['user-agent'] },
      fbclid, referral_code_used: ref, source_channel: 'Referral',
    });
    return send(res, 200, { success: true });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
