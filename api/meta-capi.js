/* POST /api/meta-capi — forward a browser conversion to Meta CAPI, sharing the
   event_id the Pixel used for dedup. Best-effort; no-op if Meta env unset. */

const { applyCors, send, readJson, clientIp } = require('./_util');
const meta = require('./_meta');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const b = await readJson(req);
    if (!b.event_name || !b.event_id) return send(res, 400, { error: 'event_name and event_id required' });
    const r = await meta.sendEvent({
      event_name: b.event_name, event_id: b.event_id, event_source_url: b.event_source_url,
      user: Object.assign({ ip: clientIp(req), ua: req.headers['user-agent'] }, b.user || {}),
      custom_data: b.custom_data || {},
    });
    return send(res, 200, { ok: true, result: r });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
