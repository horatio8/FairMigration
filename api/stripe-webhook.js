/* POST /api/stripe-webhook — Stripe-signed donation events.
   Manual HMAC verification on the raw body; idempotent on the Stripe object id. */

const { send, readRaw } = require('./_util');
const { verifySignature, stripeGet } = require('./_stripe');
const AT = require('./_airtable');
const OPS = require('./_ops');
const meta = require('./_meta');

// Vercel: keep the body unparsed so we can verify the Stripe signature.
module.exports.config = { api: { bodyParser: false } };

async function resolveCustomer(obj) {
  const cd = obj.customer_details || {};
  let email = cd.email || obj.customer_email || '';
  let name = cd.name || '';
  let phone = cd.phone || '';
  const addr = cd.address || {};
  let postcode = addr.postal_code || '';
  let country = addr.country || '';
  if ((!email || !name) && obj.customer) {
    try {
      const cust = await stripeGet('customers/' + obj.customer);
      email = email || cust.email || '';
      name = name || cust.name || '';
      phone = phone || cust.phone || '';
      const ca = cust.address || {};
      postcode = postcode || ca.postal_code || '';
      country = country || ca.country || '';
    } catch (e) {}
  }
  return { email, name, phone, postcode, country };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });

  let raw;
  try { raw = await readRaw(req); } catch (e) { return send(res, 400, { error: 'no body' }); }
  if (!verifySignature(raw, req.headers['stripe-signature'])) return send(res, 400, { error: 'signature verification failed' });

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch (e) { return send(res, 400, { error: 'bad json' }); }

  try {
    const type = event.type;
    const obj = event.data && event.data.object;
    if (!obj) return send(res, 200, { received: true });

    // subscriptions: the first checkout has mode 'subscription' — defer to invoice.paid
    if (type === 'checkout.session.completed' && obj.mode === 'subscription') return send(res, 200, { received: true, deferred: 'subscription' });
    if (type !== 'checkout.session.completed' && type !== 'invoice.paid') return send(res, 200, { received: true, ignored: type });

    const isCheckout = type === 'checkout.session.completed';
    const cust = await resolveCustomer(obj);

    // petition slug: checkout carries client_reference_id; rebills recover via subscription metadata
    let petition_slug = isCheckout ? (obj.client_reference_id || '') : '';
    if (!petition_slug && obj.subscription) {
      try { const sub = await stripeGet('subscriptions/' + obj.subscription); petition_slug = (sub.metadata && (sub.metadata.petition_slug || sub.metadata.client_reference_id)) || ''; } catch (e) {}
    }

    const amount_cents = isCheckout ? (obj.amount_total || 0) : (obj.amount_paid || 0);
    const currency = (obj.currency || 'aud').toUpperCase();
    const stripe_payment_intent = obj.payment_intent || (obj.charge ? obj.charge : '');

    const contact = await AT.matchOrCreateContact(
      { first_name: (cust.name || '').split(' ')[0], last_name: (cust.name || '').split(' ').slice(1).join(' '),
        email: cust.email, mobile: cust.phone, postcode: cust.postcode },
      { first_source_channel: 'Direct', status: 'Donor Only' }
    );
    await AT.setReferralCodeIfMissing({ id: contact.id, fields: contact.fields });
    await AT.bumpStatus(contact, 'donor');

    const donation = {
      amount_cents, currency, stripe_object_type: isCheckout ? 'checkout.session' : 'invoice',
      stripe_object_id: obj.id, stripe_payment_intent, email: cust.email, name: cust.name, phone: cust.phone,
      postcode: cust.postcode, country: cust.country, content_name: 'Donation',
      source_url: (obj.success_url || ''), fbclid: '', fbp: '', petition_slug,
    };
    const meta_event_id = 'stripe_' + obj.id;
    const { duplicate } = await AT.logEventIdempotent({
      event_type: 'Donation', contactId: contact.id,
      payload: { petition_slug, amount_cents, currency, raw: obj },
      meta_event_id, source_channel: 'Direct',
      curated: { donation, timestamp: AT.nowISO(), payload: { petition_slug, amount_cents, currency } },
    });

    if (!duplicate) {
      meta.sendEvent({
        event_name: 'Purchase', event_id: meta_event_id,
        user: { email: cust.email, phone: cust.phone, first_name: contact.fields.first_name, last_name: contact.fields.last_name,
          postcode: cust.postcode, country: cust.country || 'AU', external_id: contact.contact_id, ip: '', ua: '' },
        custom_data: { currency, value: amount_cents / 100, content_name: 'Donation' },
      }).catch(() => {});

      // close the lapse row, credit the referrer, and roll up A/B revenue
      const md = obj.metadata || {};
      try { const lp = await OPS.findPendingLapse({ session_id: obj.id }); if (lp) await OPS.updateLapse(lp.id, { status: 'completed', triggered_at: AT.nowISO() }); } catch (e) {}
      if (md.ref) OPS.upsertRollup(String(md.ref).toUpperCase(), { donations: 1, dollars: amount_cents / 100 }).catch(() => {});
      if (md.sms_variant === 'A' || md.sms_variant === 'B') {
        const day = AT.nowISO().slice(0, 10);
        OPS.upsertAbDaily(day, 'sms_signup', md.sms_variant, { gifts: 1, revenue: amount_cents / 100 }).catch(() => {});
      }
    }

    return send(res, 200, { received: true, duplicate });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
