/* POST /api/cellcast-inbound — Cellcast reply webhook (Basic-auth).
   Idempotent SMS Replies row; syncs sms_opt_out on STOP; optional relay. */

const { send, readJson, safeEqual } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');

function checkAuth(req) {
  const expected = process.env.CELLCAST_WEBHOOK_BASIC;
  if (!expected) return true; // unset = open (dev)
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Basic ')) return false;
  return safeEqual(Buffer.from(hdr.slice(6), 'base64').toString('utf8'), expected);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!checkAuth(req)) { res.statusCode = 401; res.setHeader('WWW-Authenticate', 'Basic'); res.end('unauthorized'); return; }
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const b = await readJson(req);
    const phone = AT.normPhoneAU(b.from || b.sender || b.mobile || b.source || '');
    const message = b.message || b.body || b.text || '';
    const received_at = b.received_at || b.timestamp || b.date || AT.nowISO();
    if (!phone) return send(res, 200, { ok: true, ignored: 'no_phone' });

    const reply_id = phone + '|' + received_at;
    let matched_contact_id = '';
    const contact = await AT.findOne(AT.T.contacts, `{mobile}='${AT.esc(phone)}'`);
    if (contact) matched_contact_id = contact.fields.contact_id || '';

    await OPS.upsertReply(reply_id, { phone, message, received_at, raw: JSON.stringify(b).slice(0, 9000), matched_contact_id });

    // Opt-out: an inbound STOP reply, or a dedicated Cellcast opt-out callback (which
    // may carry no message body). Detect both so Receiver + Opt-Out can share this URL.
    const flag = (v) => v === true || v === 'true' || v === 1 || v === '1';
    const kind = String(b.type || b.event || b.status || b.action || '');
    const isOptOut = /^\s*(stop|unsub|unsubscribe|opt[\s-]?out|cancel|end|quit)\b/i.test(message)
      || flag(b.optOut) || flag(b.opt_out) || flag(b.optout) || flag(b.unsubscribe) || flag(b.unsubscribed)
      || /opt[\s-]?out|unsubscrib/i.test(kind);
    if (isOptOut) {
      if (contact) { try { await AT.updateRecord(AT.T.contacts, contact.id, { sms_opt_out: true }); } catch (e) {} }
      await AT.logEvent({ event_type: 'SMS Opt Out', contactId: contact ? contact.id : undefined, payload: { phone, message, kind }, source_channel: 'Referral' });
    }

    if (process.env.CELLCAST_FORWARD_URL) {
      try { fetch(process.env.CELLCAST_FORWARD_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); } catch (e) {}
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
