/* POST /api/petition-signup — match-or-create the signer, attribute referral,
   log the Petition Signed event, fan out to Petition Signatures, fire Meta Lead. */

const { applyCors, send, readJson, clientIp } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');
const meta = require('./_meta');
const cellcast = require('./_cellcast');
const cn = require('./_cn');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured (missing Airtable env)' });

  try {
    const body = await readJson(req);
    const { first_name, last_name, email, mobile, postcode, fbclid, fbp, ref } = body;
    if (!first_name || !last_name || !email) return send(res, 400, { error: 'first_name, last_name and email are required' });

    const sourceChannel = ref ? 'Referral' : (fbclid ? 'Facebook' : 'Direct');
    const contact = await AT.matchOrCreateContact(
      { first_name, last_name, email, mobile, postcode, fbclid, fbp },
      { first_source_channel: sourceChannel, status: 'Signatory Only' }
    );
    const referral_code = await AT.setReferralCodeIfMissing({ id: contact.id, fields: contact.fields });
    await AT.bumpStatus(contact, 'signatory');

    // referral attribution: link new contact to referrer + credit the referrer
    if (ref) {
      const referrer = await AT.resolveReferrerByCode(ref);
      if (referrer && referrer.id !== contact.id) {
        if (contact.isNew && !(contact.fields && contact.fields.referred_by)) {
          try { await AT.updateRecord(AT.T.contacts, contact.id, { referred_by: [referrer.id] }); } catch (e) {}
        }
        await AT.logEvent({
          event_type: 'Share Conversion', contactId: referrer.id,
          payload: { ref, converted_contact_id: contact.contact_id, email },
          referral_code_used: ref, source_channel: 'Referral',
        });
        OPS.upsertRollup(String(ref).toUpperCase(), { signups: 1 }).catch(() => {});
      }
    }

    const meta_event_id = 'petition_' + contact.contact_id + '_' + Date.now();
    const payload = Object.assign({}, body, { email: AT.normEmail(email), mobile: AT.normPhoneAU(mobile) });
    await AT.logEvent({
      event_type: 'Petition Signed', contactId: contact.id, payload,
      fbclid, referral_code_used: ref, source_channel: sourceChannel, meta_event_id,
      curated: { payload, timestamp: AT.nowISO() },
    });

    // Fan out to Meta CAPI, Cellcast and Campaign Nucleus. These MUST be awaited:
    // on Vercel the function is frozen once the response is sent, so fire-and-forget
    // work (e.g. the CAPI HTTPS request) would be killed before it completes.
    const metaResultP = meta.sendEvent({
      event_name: 'Lead', event_id: meta_event_id, event_source_url: body.source_url || body.landing_url,
      user: { email, phone: mobile, first_name, last_name, postcode, country: 'Australia',
        external_id: contact.contact_id, fbp, fbclid, ip: clientIp(req), ua: req.headers['user-agent'] },
      custom_data: { content_name: body.content_name || 'Petition' },
    }).catch((e) => ({ error: String(e.message || e) }));

    // A/B-tested thank-you SMS (no-op unless Cellcast configured)
    const smsP = cellcast.enqueueSignupSMS({ id: contact.id, fields: Object.assign({}, contact.fields, { referral_code }) }).catch(() => {});

    // Push the signature to the Campaign Nucleus form receiver
    const cnP = cn.pushPetitionReceiver({
      first_name, last_name, email: AT.normEmail(email), phone: AT.normPhoneAU(mobile),
      message: body.message || 'Signed the Fair Migration petition',
    }).catch((e) => ({ error: String(e.message || e) }));

    const [metaResult] = await Promise.all([metaResultP, smsP, cnP]);

    const out = { success: true, contact_id: contact.contact_id, referral_code, meta_event_id, is_new_contact: contact.isNew };
    if (body.debug) out.meta = metaResult; // diagnostic echo of the CAPI response
    return send(res, 200, out);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
