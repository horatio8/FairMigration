/* Cellcast v1 SMS — gateway send, A/B thank-you + donation-lapse templates,
   quiet-hours scheduling, and a self-dispatcher for long-delay queued sends.
   No-ops when CELLCAST_API_KEY is unset. */

const AT = require('./_airtable');
const OPS = require('./_ops');

const API_BASE = process.env.CELLCAST_API_BASE || 'https://api.cellcast.com/api/v1';
const QS = parseInt((process.env.SMS_QUIET_START || '08:00').split(':')[0], 10);
const QE = parseInt((process.env.SMS_QUIET_END || '20:00').split(':')[0], 10);
const DELAY_MIN = parseInt(process.env.SMS_DELAY_MIN_S || '15', 10);
const DELAY_MAX = parseInt(process.env.SMS_DELAY_MAX_S || '55', 10);
const ORIGIN = process.env.PRODUCTION_ORIGIN || 'https://fairmigration.vote';

/* ---------- templates (edit copy freely; contract is {first},{link}) ---------- */
const TEMPLATES = {
  signup_ab: {
    A: ({ first, link }) => `${first}, James from Fair Migration. Thanks for signing. Chip in to keep the pressure on Canberra: ${link}`,
    B: ({ first, link }) => `${first}, mass migration is driving up your rent and gridlocking your city. Help Fair Migration make Canberra listen: ${link}`,
  },
  donation_lapse_24h: () => ({ first, link }) => `${first}, you were one click from backing fair migration yesterday. Finish what you started: ${link}`,
};

const firstName = (n) => (String(n || '').trim().split(/\s+/)[0] || 'Friend');
const originLink = (path) => ORIGIN + path;
function appendCode(message, link, code) {
  if (!code || process.env.SMS_INCLUDE_CONTACT_REF === '0') return message;
  const linked = link + (link.includes('?') ? '&' : '?') + 'c=' + code;
  const candidate = message.replace(link, linked);
  return candidate.length <= 160 ? candidate : message;
}

/* ---------- Melbourne wall-clock helpers (AEST/AEDT via Intl) ---------- */
function melbParts(date) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Melbourne', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = {}; for (const x of dtf.formatToParts(date)) p[x.type] = x.value;
  return p;
}
function melbOffsetMs(date) {
  const p = melbParts(date);
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - date.getTime();
}
function clampToQuietHours(date) {
  const p = melbParts(date); const hour = +p.hour;
  if (hour >= QS && hour < QE) return date;
  let y = +p.year, m = +p.month, d = +p.day;
  if (hour >= QE) { const t = new Date(date.getTime() + 24 * 3600 * 1000); const p2 = melbParts(t); y = +p2.year; m = +p2.month; d = +p2.day; }
  const min = 5 + Math.floor(Math.random() * 11); // 08:05–08:15
  const approx = new Date(Date.UTC(y, m - 1, d, QS, min, 0));
  return new Date(Date.UTC(y, m - 1, d, QS, min, 0) - melbOffsetMs(approx));
}
function scheduleSignupSMS() {
  const delay = (DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN)) * 1000;
  return clampToQuietHours(new Date(Date.now() + delay));
}
function formatCellcastTime(date) { // "Y-m-d H:i:s" UTC
  const s = date.toISOString(); return s.slice(0, 10) + ' ' + s.slice(11, 19);
}

/* ---------- gateway ---------- */
async function sendGateway({ message, contacts, scheduleAt }) {
  const body = { message, contacts, replyStopToOptOut: true };
  if (process.env.CELLCAST_FROM) body.sender = process.env.CELLCAST_FROM;
  if (scheduleAt) body.scheduleAt = scheduleAt;
  let j = {};
  try {
    const res = await fetch(API_BASE + '/gateway', { method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.CELLCAST_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    j = await res.json().catch(() => ({}));
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
  const qr = j.data && j.data.queueResponse && j.data.queueResponse[0];
  const ok = j.status === true && qr && qr.MessageId;
  const optout = (j.data && Array.isArray(j.data.unsubscribeContacts) && j.data.unsubscribeContacts.length > 0)
    || /unsubscribed/i.test(String(j.message || ''));
  return { ok: !!ok, optout, id: ok ? qr.MessageId : null, raw: j };
}

async function applyResult(sendId, r, phone, scheduled) {
  if (r.optout) {
    await OPS.updateSmsSend(sendId, { status: 'suppressed', error: 'opt_out' });
    try { const c = await AT.findOne(AT.T.contacts, `{mobile}='${AT.esc(phone)}'`); if (c) await AT.updateRecord(AT.T.contacts, c.id, { sms_opt_out: true }); } catch (e) {}
    return 'suppressed';
  }
  if (r.ok) { await OPS.updateSmsSend(sendId, { status: scheduled ? 'scheduled' : 'sent', sent_at: AT.nowISO(), cellcast_id: String(r.id) }); return scheduled ? 'scheduled' : 'sent'; }
  await OPS.updateSmsSend(sendId, { status: 'failed', error: String((r.raw && r.raw.msg) || r.error || 'send failed').slice(0, 250) });
  return 'failed';
}

/* ---------- enqueue ---------- */
async function enqueueSignupSMS(contact) {
  if (!process.env.CELLCAST_API_KEY) return { skipped: 'no_cellcast' };
  const f = contact.fields || {};
  if (!f.mobile || !/^\+/.test(f.mobile)) return { skipped: 'no_mobile' };
  if (f.sms_opt_out) return { skipped: 'opt_out' };
  if (f.status === 'Donor Only' || f.status === 'Signatory + Donor') return { skipped: 'existing_donor' };
  const ph = AT.phoneHash(f.mobile);
  if (await OPS.findQueuedSend(ph, 'signup_ab')) return { skipped: 'already_queued' };
  const variant = AT.abVariant(ph);
  const link = originLink(variant === 'A' ? '/fund' : '/fight');
  let message = TEMPLATES.signup_ab[variant]({ first: firstName(f.first_name), link });
  message = appendCode(message, link, f.referral_code);
  const notBefore = scheduleSignupSMS();
  const rec = await OPS.createSmsSend({ status: 'queued', phone: f.mobile, phone_hash: ph, template: 'signup_ab', variant, message, not_before: notBefore.toISOString() });
  const delayS = (notBefore.getTime() - Date.now()) / 1000;
  if (delayS > 5 && delayS <= 90) {
    const r = await sendGateway({ message, contacts: [f.mobile], scheduleAt: formatCellcastTime(notBefore) });
    await applyResult(rec.id, r, f.mobile, true);
  }
  return { send_id: rec.fields.send_id, variant, status: 'queued' };
}

async function enqueueDonationLapseSMS({ mobile, first_name, referral_code }) {
  if (!process.env.CELLCAST_API_KEY) return { skipped: 'no_cellcast' };
  if (!mobile || !/^\+/.test(mobile)) return { skipped: 'no_mobile' };
  const ph = AT.phoneHash(mobile);
  if (await OPS.findQueuedSend(ph, 'donation_lapse_24h')) return { skipped: 'already_queued' };
  const variant = AT.abVariant(ph + '|donation');
  const link = originLink('/fund');
  let message = TEMPLATES.donation_lapse_24h(variant)({ first: firstName(first_name), link });
  message = appendCode(message, link, referral_code);
  const notBefore = clampToQuietHours(new Date(Date.now() + 24 * 3600 * 1000));
  const rec = await OPS.createSmsSend({ status: 'queued', phone: mobile, phone_hash: ph, template: 'donation_lapse_24h', variant, message, not_before: notBefore.toISOString() });
  return { send_id: rec.fields.send_id, variant, status: 'queued' };
}

/* ---------- dispatcher (drains due 'queued' rows) ---------- */
async function dispatchDueSMS() {
  if (!process.env.CELLCAST_API_KEY) return { sent: 0, skipped: 'no_cellcast' };
  const horizon = new Date().toISOString();
  const due = await OPS.findDueSends(horizon, 25);
  let sent = 0;
  for (const row of due) {
    const f = row.fields;
    const r = await sendGateway({ message: f.message, contacts: [f.phone] });
    const outcome = await applyResult(row.id, r, f.phone, false);
    if (outcome === 'sent') sent++;
  }
  return { due: due.length, sent };
}

/* ---------- inbound poll backstop ---------- */
async function getResponses() {
  if (!process.env.CELLCAST_API_KEY) return [];
  try {
    const url = new URL(API_BASE).origin + '/apiClient/getResponses';
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.CELLCAST_API_KEY } });
    const j = await res.json().catch(() => ({}));
    return (j.data && (j.data.responses || j.data)) || [];
  } catch (e) { return []; }
}

module.exports = { enqueueSignupSMS, enqueueDonationLapseSMS, dispatchDueSMS, getResponses, sendGateway, clampToQuietHours };
