/* POST /api/partial — abandoned-form capture, in two stages.

   stage:"capture" (default) fires as soon as someone has typed enough to
   identify them. It is recorded in Airtable's Lapse Queue ONLY.

   stage:"exit" fires when they actually leave without submitting. That is the
   only stage pushed to the Campaign Nucleus receiver, and it keeps the CN-first
   ordering so a lost abandoner is never Airtable's fault.

   Why the split: the CN petition form treats email as unique and keeps the
   FIRST entry per address. A partial pushed while someone is still filling in
   the form takes that slot, and the real signature posted seconds later is
   accepted with a 200 and silently discarded — every signer would be filed as
   an abandoner. Holding CN back until genuine abandonment removes the collision.

   completed:true closes the loop when they do submit, so they aren't chased.
   Partials never enter Contacts.
   { form:"petition"|"donation", stage?, email?, mobile?, first_name?, last_name?, postcode?, completed? } */

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
    const stage = b.stage === 'exit' ? 'exit' : 'capture';
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

    /* ---- 1. Genuine abandonment only: CN receiver first, and awaited ---- */
    let cnResult = { skipped: 'capture_stage' };
    if (stage === 'exit') {
      cnResult = await CN.pushPartialReceiver({
        first_name: b.first_name || '', last_name: b.last_name || '', email, phone: mobile,
        message: 'PARTIAL (' + form + ') — started but did not submit' + (b.postcode ? ' · postcode ' + b.postcode : ''),
      });
      CN.matchProfile({ first_name: b.first_name, last_name: b.last_name, email, mobile, postcode: b.postcode, tags: [`${form}_partial`] }).catch(() => {});
    }

    /* ---- 2. Airtable Lapse Queue row: best-effort, never fatal ---- */
    let airtable = 'skipped';
    if (AT.configured()) {
      try {
        // avoid duplicate pending rows for the same identity+form (the capture
        // stage will usually have created it already)
        const existing = email ? await OPS.findPendingLapse({ email, form }) : null;
        if (!existing) {
          await OPS.createLapse({ form, email, mobile, first_name: b.first_name || '', last_name: b.last_name || '' });
        }
        airtable = 'ok';
      } catch (e) {
        airtable = 'degraded';
        console.error('[partial] airtable degraded ' + JSON.stringify({
          form, stage, email, mobile, first_name: b.first_name || '', last_name: b.last_name || '',
          postcode: b.postcode || '', at: AT.nowISO(), error: String(e.message || e).slice(0, 300),
        }));
      }
    }

    const out = { ok: true, stage };
    if (b.debug) { out.cn = cnResult; out.airtable = airtable; }
    return send(res, 200, out);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
