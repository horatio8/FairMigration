/* GET /api/cron/sms-inbound-poll (hourly) — Cellcast getResponses backstop.
   Idempotently records replies + handles STOP opt-outs. */

const { send, requireCron } = require('../_util');
const AT = require('../_airtable');
const OPS = require('../_ops');
const cellcast = require('../_cellcast');

module.exports = async (req, res) => {
  if (!requireCron(req, res)) return;
  if (!AT.configured()) return send(res, 200, { skipped: 'no_airtable' });
  const replies = await cellcast.getResponses();
  let recorded = 0, optouts = 0;
  for (const r of (replies || [])) {
    const phone = AT.normPhoneAU(r.from || r.sender || r.mobile || r.source || '');
    const message = r.message || r.body || r.text || '';
    const received_at = r.received_at || r.timestamp || r.date || AT.nowISO();
    if (!phone) continue;
    const contact = await AT.findOne(AT.T.contacts, `{mobile}='${AT.esc(phone)}'`).catch(() => null);
    const dup = await OPS.upsertReply(phone + '|' + received_at, { phone, message, received_at,
      raw: JSON.stringify(r).slice(0, 9000), matched_contact_id: contact ? contact.fields.contact_id : '' });
    if (!dup.duplicate) recorded++;
    if (/^\s*stop\b/i.test(message) && contact) {
      try { await AT.updateRecord(AT.T.contacts, contact.id, { sms_opt_out: true }); } catch (e) {}
      if (!dup.duplicate) { await AT.logEvent({ event_type: 'SMS Opt Out', contactId: contact.id, payload: { phone, message } }); optouts++; }
    }
  }
  return send(res, 200, { polled: (replies || []).length, recorded, optouts });
};
