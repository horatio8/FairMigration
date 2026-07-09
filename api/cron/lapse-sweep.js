/* GET /api/cron/lapse-sweep (every 5 min) — the abandoned-cart state machine.
   Pending Lapse Queue rows older than 30 min: complete / enrol in CN automation
   / queue a donation-lapse SMS. Tail: drain due queued SMS. */

const { send, requireCron } = require('../_util');
const AT = require('../_airtable');
const OPS = require('../_ops');
const CN = require('../_cn');
const { stripeGet } = require('../_stripe');
const cellcast = require('../_cellcast');

function automationId(form, variant) {
  const base = form === 'donation' ? 'CN_AUTOMATION_DONATION_LAPSE' : 'CN_AUTOMATION_PETITION_LAPSE';
  return process.env[base + '_' + variant] || process.env[base] || '';
}

module.exports = async (req, res) => {
  if (!requireCron(req, res)) return;
  if (!AT.configured()) return send(res, 200, { skipped: 'no_airtable' });

  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // literal cutoff, not NOW()
  const rows = await OPS.findDueLapses(cutoff, 40);
  const out = { seen: rows.length, completed: 0, triggered: 0, skipped: 0, pending: 0 };

  for (const row of rows) {
    const f = row.fields;
    try {
      let email = AT.normEmail(f.email), first_name = f.first_name, last_name = f.last_name, phone = AT.normPhoneAU(f.mobile);

      // (1) completion check
      if (f.form === 'donation' && f.session_id) {
        const s = await stripeGet('checkout/sessions/' + f.session_id).catch(() => null);
        if (s && s.payment_status === 'paid') { await OPS.updateLapse(row.id, { status: 'completed' }); out.completed++; continue; }
        // recover identity from the Stripe session for anonymous abandons
        if (s && s.customer_details) { email = email || AT.normEmail(s.customer_details.email); first_name = first_name || (s.customer_details.name || '').split(' ')[0]; phone = phone || AT.normPhoneAU(s.customer_details.phone); }
      } else if (f.form === 'petition' && email) {
        const sig = await AT.findOne(AT.T.signatures, `AND(LOWER({email})='${AT.esc(email)}', IS_AFTER({timestamp}, '${f.created_at}'))`);
        if (sig) { await OPS.updateLapse(row.id, { status: 'completed' }); out.completed++; continue; }
      }

      // (2) resolve identity
      if (!email && !phone) { await OPS.updateLapse(row.id, { status: 'skipped', note: 'no identity' }); out.skipped++; continue; }

      // (3) enrol in the matching CN automation (variant deterministic on identity)
      const variant = f.variant || AT.abVariant(email || phone);
      const autoId = automationId(f.form, variant);
      if (!autoId) { out.pending++; continue; } // leave pending until automation IDs are set
      await CN.enrolAutomation(autoId, { email, first_name, last_name, mobile: phone });
      await OPS.updateLapse(row.id, { status: 'triggered', triggered_at: AT.nowISO(), variant, email, first_name: first_name || '', mobile: phone || '' });
      out.triggered++;

      // (4) donation lapsers with a mobile → +24h SMS nudge
      if (f.form === 'donation' && phone) {
        const c = await AT.findOne(AT.T.contacts, `{mobile}='${AT.esc(phone)}'`).catch(() => null);
        await cellcast.enqueueDonationLapseSMS({ mobile: phone, first_name, referral_code: c && c.fields.referral_code });
      }
    } catch (e) {
      await OPS.updateLapse(row.id, { status: 'error', note: String(e.message || e).slice(0, 200) }).catch(() => {});
    }
  }

  const sms = await cellcast.dispatchDueSMS().catch(() => ({}));
  return send(res, 200, Object.assign(out, { sms }));
};
