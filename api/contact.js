/* POST /api/contact — a Contact Us enquiry. Pushes to the Campaign Nucleus
   contact receiver form and best-effort logs the enquirer in Airtable. */

const { applyCors, send, readJson } = require('./_util');
const AT = require('./_airtable');
const cn = require('./_cn');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const first_name = String(body.first_name || '').trim();
    const last_name = String(body.last_name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || body.mobile || '').trim();
    const message = String(body.message || '').trim();

    if (!first_name) return send(res, 400, { error: 'first_name is required' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'A valid email is required' });
    if (!message) return send(res, 400, { error: 'message is required' });

    // Primary integration: push the enquiry to the CN contact receiver form.
    const cnResult = await cn.pushContactReceiver({
      first_name, last_name, email: AT.normEmail ? AT.normEmail(email) : email,
      phone: AT.normPhoneAU ? AT.normPhoneAU(phone) : phone, message: message.slice(0, 250),
    });

    // Capture the enquiry in Airtable as a Contact Enquiry event (awaited so it
    // persists on Vercel). Logged as an event only — not a Contact — so it never
    // inflates the signature counter or creates spurious supporter records.
    if (AT.configured && AT.configured()) {
      try {
        await AT.logEvent({
          event_type: 'Contact Enquiry',
          payload: { first_name, last_name, email, phone, message },
          source_channel: 'Direct',
        });
      } catch (e) {}
    }

    return send(res, 200, { success: true, cn: cnResult && (cnResult.ok || cnResult.skipped) ? 'ok' : 'error' });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
