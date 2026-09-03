/* POST /api/join — newsletter + volunteer sign-ups.
   { kind:"newsletter"|"volunteer", first_name, last_name?, email, mobile?, postcode?, message? }

   Same ordering guarantee as petition-signup: the Campaign Nucleus receiver is the
   capture of record and is pushed first (with retry); Airtable is best-effort and
   can never throttle, block or fail the sign-up. */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const CN = require('./_cn');

// Optional dedicated receivers; otherwise the petition receiver takes them.
const RECEIVERS = {
  newsletter: process.env.CN_NEWSLETTER_RECEIVER_URL || '',
  volunteer: process.env.CN_VOLUNTEER_RECEIVER_URL || '',
};

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const b = await readJson(req);
    const kind = b.kind === 'volunteer' ? 'volunteer' : 'newsletter';
    const email = AT.normEmail(b.email);
    const mobile = AT.normPhoneAU(b.mobile);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'A valid email is required' });

    const label = kind === 'volunteer' ? 'VOLUNTEER' : 'NEWSLETTER';
    const message = (b.message && String(b.message).slice(0, 240)) ||
      (kind === 'volunteer' ? 'Volunteer sign-up' : 'Newsletter sign-up');

    /* ---- 1. Guaranteed capture ---- */
    const fields = {
      first_name: b.first_name || '', last_name: b.last_name || '',
      email, phone: mobile, message: label + ' — ' + message + (b.postcode ? ' · postcode ' + b.postcode : ''),
    };
    const cnResult = RECEIVERS[kind]
      ? await CN.postFormReceiver(RECEIVERS[kind], fields)
      : await CN.pushPetitionReceiver(fields);

    /* ---- 2. Airtable log: best-effort, never fatal ---- */
    let airtable = 'skipped';
    if (AT.configured()) {
      try {
        // 'Other' is an existing event_type option, so this never fails on an
        // unknown single-select value; `kind` carries the detail in the payload.
        await AT.logEvent({
          event_type: 'Other', source_channel: 'Direct',
          payload: { kind, first_name: b.first_name || '', last_name: b.last_name || '', email, mobile, postcode: b.postcode || '', message },
        });
        airtable = 'ok';
      } catch (e) {
        airtable = 'degraded';
        console.error('[join] airtable degraded — sign-up captured in CN only ' + JSON.stringify({
          kind, email, mobile, at: AT.nowISO(), error: String(e.message || e).slice(0, 300),
        }));
      }
    }

    const out = { success: true, kind };
    if (b.debug) { out.cn = cnResult; out.airtable = airtable; }
    return send(res, 200, out);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
