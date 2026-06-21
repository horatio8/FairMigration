/* POST /api/share-issued — donor pressed a share button on /share.
   Log a Share Issued event on the sharer. One row per click (no dedup). */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const { referral_code, platform, share_url } = await readJson(req);
    if (!referral_code) return send(res, 400, { error: 'referral_code required' });
    const referrer = await AT.resolveReferrerByCode(referral_code);
    if (!referrer) return send(res, 404, { error: 'referrer not found' });
    await AT.logEvent({
      event_type: 'Share Issued', contactId: referrer.id,
      payload: { platform, share_url }, referral_code_used: referral_code, source_channel: 'Referral',
    });
    return send(res, 200, { success: true });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
