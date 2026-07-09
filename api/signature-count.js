/* GET /api/signature-count → { count, display, raw, offset, updated_at }.
   One cheap Site Stats read; falls back to the base offset if unconfigured. */

const { applyCors, send } = require('./_util');
const AT = require('./_airtable');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  const offset = AT.SIGNATURE_BASE_OFFSET;
  if (!AT.configured()) {
    const count = offset;
    return send(res, 200, { count, display: count.toLocaleString(), raw: 0, offset, updated_at: null });
  }
  try {
    const stat = await AT.getStat('signature_count');
    const raw = stat ? stat.num : 0;
    const count = AT.publicSignatureCount(raw);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return send(res, 200, { count, display: count.toLocaleString(), raw, offset, updated_at: AT.nowISO() });
  } catch (err) {
    return send(res, 200, { count: offset, display: offset.toLocaleString(), raw: 0, offset, error: String(err.message || err) });
  }
};
