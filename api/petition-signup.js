/* POST /api/petition-signup — capture a signature.

   Ordering matters under load. Campaign Nucleus (one HTTP POST) is the capture of
   record and is pushed FIRST, so it can never be blocked or failed by Airtable.
   Airtable is rate limited to 5 requests/second per base — far below a burst of
   thousands of signatures a minute — so its writes are strictly best-effort:
   wrapped so they can never throw, never gate CN/Meta, and never fail the request.
   If Airtable is throttled the signature still lands in CN and Meta, and a
   structured overflow line is logged so nothing is unrecoverable. */

const { applyCors, send, readJson, clientIp } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');
const meta = require('./_meta');
const cellcast = require('./_cellcast');
const cn = require('./_cn');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const { first_name, last_name, email, mobile, postcode, fbclid, fbp, ref } = body;
    if (!first_name || !last_name || !email) return send(res, 400, { error: 'first_name, last_name and email are required' });

    const emailN = AT.normEmail(email);
    const phoneN = AT.normPhoneAU(mobile);
    const sourceChannel = ref ? 'Referral' : (fbclid ? 'Facebook' : 'Direct');

    // Identity is generated locally so the response (and the supporter's share
    // link) is valid even if Airtable is unavailable or throttled.
    const preContactId = AT.uuid();
    const preReferralCode = await AT.uniqueCode();
    const meta_event_id = 'petition_' + preContactId + '_' + Date.now();

    /* ---- 1. Guaranteed captures: one HTTP request each, no Airtable dependency ---- */
    const cnP = cn.pushPetitionReceiver({
      first_name, last_name, email: emailN, phone: phoneN,
      message: body.message || 'Signed the Fair Migration petition',
    }).catch((e) => ({ error: String(e.message || e) }));

    const metaP = meta.sendEvent({
      event_name: 'Lead', event_id: meta_event_id, event_source_url: body.source_url || body.landing_url,
      user: { email, phone: mobile, first_name, last_name, postcode, country: 'Australia',
        external_id: emailN, fbp, fbclid, ip: clientIp(req), ua: req.headers['user-agent'] },
      custom_data: { content_name: body.content_name || 'Petition' },
    }).catch((e) => ({ error: String(e.message || e) }));

    const cnResult = await cnP; // capture of record — awaited before anything else

    /* ---- 2. Airtable enrichment: best-effort, isolated, never fatal ---- */
    let referral_code = preReferralCode;
    let contact_id = preContactId;
    let is_new_contact = true;
    let airtable = 'skipped';

    if (AT.configured()) {
      try {
        const contact = await AT.matchOrCreateContact(
          { first_name, last_name, email, mobile, postcode, fbclid, fbp },
          { first_source_channel: sourceChannel, status: 'Signatory Only',
            contact_id: preContactId, referral_code: preReferralCode }
        );
        contact_id = contact.contact_id || preContactId;
        referral_code = (contact.fields && contact.fields.referral_code) || preReferralCode;
        is_new_contact = contact.isNew;
        await AT.bumpStatus(contact, 'signatory');

        // referral attribution: link the new contact to the referrer + credit them
        if (ref) {
          const referrer = await AT.resolveReferrerByCode(ref);
          if (referrer && referrer.id !== contact.id) {
            if (contact.isNew && !(contact.fields && contact.fields.referred_by)) {
              try { await AT.updateRecord(AT.T.contacts, contact.id, { referred_by: [referrer.id] }); } catch (e) {}
            }
            await AT.logEvent({
              event_type: 'Share Conversion', contactId: referrer.id,
              payload: { ref, converted_contact_id: contact_id, email: emailN },
              referral_code_used: ref, source_channel: 'Referral',
            });
            OPS.upsertRollup(String(ref).toUpperCase(), { signups: 1 }).catch(() => {});
          }
        }

        const payload = Object.assign({}, body, { email: emailN, mobile: phoneN });
        await AT.logEvent({
          event_type: 'Petition Signed', contactId: contact.id, payload,
          fbclid, referral_code_used: ref, source_channel: sourceChannel, meta_event_id,
          curated: { payload, timestamp: AT.nowISO() },
        });

        // A/B-tested thank-you SMS (no-op unless Cellcast configured)
        await cellcast.enqueueSignupSMS({
          id: contact.id, fields: Object.assign({}, contact.fields, { referral_code }),
        }).catch(() => {});
        airtable = 'ok';
      } catch (e) {
        // Rate limited / down. CN already holds the signature; log it for recovery.
        airtable = 'degraded';
        console.error('[petition-signup] airtable degraded — signature captured in CN only ' + JSON.stringify({
          meta_event_id, contact_id, referral_code, first_name, last_name,
          email: emailN, mobile: phoneN, postcode: postcode || '', ref: ref || '',
          source_channel: sourceChannel, at: AT.nowISO(), error: String(e.message || e).slice(0, 300),
        }));
      }
    }

    const metaResult = await metaP;

    const out = { success: true, contact_id, referral_code, meta_event_id, is_new_contact };
    if (body.debug) {
      out.meta = metaResult; out.meta_config = meta.configStatus();
      out.cn = cnResult; out.airtable = airtable;
    }
    return send(res, 200, out);
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
