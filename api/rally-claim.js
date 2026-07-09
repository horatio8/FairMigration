/* POST /api/rally-claim — validate + decrement a comp token, log a comped ticket.
   Body { token, email?, name?, adult_qty?, kid_qty? }. */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const rally = require('./_rally');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const b = await readJson(req);
    const token = String(b.token || '').trim();
    if (!token) return send(res, 400, { error: 'token required' });

    let rec = await AT.findOne(AT.T.rallyComp, `{token}='${AT.esc(token)}'`);
    if (!rec && process.env.RALLY_COMP_TOKEN_FALLBACK && token === process.env.RALLY_COMP_TOKEN_FALLBACK) {
      // fallback token: always valid, not tracked
    } else if (!rec) {
      return send(res, 404, { error: 'invalid token' });
    } else {
      const remaining = Number(rec.fields.remaining);
      if (remaining <= 0) return send(res, 409, { error: 'token exhausted' });
      await AT.updateRecord(AT.T.rallyComp, rec.id, { remaining: remaining - 1, last_used_at: AT.nowISO() });
    }

    await rally.projectRallyTicket({ email: b.email, name: b.name, adult_qty: b.adult_qty || 1, kid_qty: b.kid_qty || 0, comped: true, source: 'comp', amount_cents: 0 });
    await AT.logEvent({ event_type: 'Rally Ticket Comped', payload: { token, email: b.email } });
    return send(res, 200, { success: true });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
