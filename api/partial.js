/* POST /api/partial — abandoned-form capture (on blur). Pushes a tagged partial
   to Campaign Nucleus and opens a Lapse Queue row. Partials never enter Contacts.
   { form:"petition"|"donation", email?, mobile?, first_name?, last_name?, postcode?, completed? } */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');
const CN = require('./_cn');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  try {
    const b = await readJson(req);
    const form = b.form === 'donation' ? 'donation' : 'petition';
    const email = AT.normEmail(b.email);
    const mobile = AT.normPhoneAU(b.mobile);
    if (!email && !mobile) return send(res, 400, { error: 'email or mobile required' });

    if (b.completed) {
      // close pending lapse rows for this identity + swap CN tag
      const pending = email ? await OPS.findPendingLapse({ email, form }) : null;
      if (pending) await OPS.updateLapse(pending.id, { status: 'completed', note: 'form completed' });
      CN.matchProfile({ first_name: b.first_name, last_name: b.last_name, email, mobile, postcode: b.postcode, tags: [`${form}_partial_completed`] }).catch(() => {});
      return send(res, 200, { ok: true, completed: true });
    }

    // avoid duplicate pending rows for the same identity+form
    const existing = email ? await OPS.findPendingLapse({ email, form }) : null;
    if (!existing) {
      await OPS.createLapse({ form, email, mobile, first_name: b.first_name || '', last_name: b.last_name || '' });
    }
    CN.matchProfile({ first_name: b.first_name, last_name: b.last_name, email, mobile, postcode: b.postcode, tags: [`${form}_partial`] }).catch(() => {});
    return send(res, 200, { ok: true });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
