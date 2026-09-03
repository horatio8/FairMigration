/* POST /api/partial — abandoned-form capture (fires on blur / page-hide).

   Same ordering guarantee as petition-signup: the Campaign Nucleus receiver is
   pushed FIRST and is the capture of record, then the Airtable "Lapse Queue" row
   is written best-effort. Airtable's 5 req/sec ceiling can never drop a partial
   or fail the request. Partials never enter Contacts.
   { form:"petition"|"donation", email?, mobile?, first_name?, last_name?, postcode?, completed? } */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');
const CN = require('./_cn');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const b = await readJson(req);
    const form = b.form === 'donation' ? 'donation' : 'petition';
    const email = AT.normEmail(b.email);
    const mobile = AT.normPhoneAU(b.mobile);
    if (!email && !mobile) return send(res, 400, { error: 'email or mobile required' });

    /* ---- completed: close the loop, don't chase them ---- */
    if (b.completed) {
      CN.matchProfile({ first_name: b.first_name, last_name: b.last_name, email, mobile, postcode: b.postcode, tags: [`${form}_partial_completed`] }).catch(() => {});
      if (AT.configured()) {
        try {
          const pending = email ? await OPS.findPendingLapse({ email, form }) : null;
          if (pending) await OPS.updateLapse(pending.id, { status: 'completed', note: 'form completed' });
        } catch (e) { /* best-effort */ }
      }
      return send(res, 200, { ok: true, completed: true });
    }

    /* ---- 1. Guaranteed capture: CN receiver first ---- */
    const cnResult = await CN.pushPartialReceiver({
      first_name: b.first_name || '', last_name: b.last_name || '', email, phone: mobile,
      message: 'PARTIAL (' + form + ') — started but did not submit' + (b.postcode ? ' · postcode ' + b.postcode : ''),
    });
    CN.matchProfile({ first_name: b.first_name, last_name: b.last_name, email, mobile, postcode: b.postcode, tags: [`${form}_partial`] }).catch(() => {});

    /* ---- 2. Airtable Lapse Queue row: best-effort, never fatal ---- */
    let airtable = 'skipped';
    if (AT.configured()) {
      try {
        // avoid duplicate pending rows for the same identity+form
        const existing = email ? await OPS.findPendingLapse({ email, form }) : null;
        if (!existing) {
          await OPS.createLapse({ form, email, mobile, first_name: b.first_name || '', last_name: b.last_name || '' });
        }
        airtable = 'ok';
      } catch (e) {
        airtable = 'degraded';
        console.error('[partial] airtable degraded — partial captured in CN only ' + JSON.stringify({
          form, email, mobile, first_name: b.first_name || '', last_name: b.last_name || '',
          postcode: b.postcode || '', at: AT.nowISO(), error: String(e.message || e).slice(0, 300),
        }));
      }
    }

    const out = { ok: true };
    if (b.debug) { out.cn = cnResult; out.airtable = airtable; }
    return send(res, 200, out);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
