/* GET /api/admin/stripe-backfill (basic-auth) — replay recent paid Checkout
   Sessions into Donations idempotently (first-deploy / missed-webhook backfill).
   ?limit=100 (default 50). */

const { send, requireBasicAuth } = require('../_util');
const { stripeGet } = require('../_stripe');
const AT = require('../_airtable');

module.exports = async (req, res) => {
  if (!requireBasicAuth(req, res)) return;
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });
  const url = new URL(req.url, 'http://x');
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10));

  try {
    const list = await stripeGet('checkout/sessions?limit=' + limit);
    let backfilled = 0, skipped = 0;
    for (const obj of (list.data || [])) {
      if (obj.payment_status !== 'paid') { skipped++; continue; }
      const cd = obj.customer_details || {};
      const contact = await AT.matchOrCreateContact({ first_name: (cd.name || '').split(' ')[0], last_name: (cd.name || '').split(' ').slice(1).join(' '), email: cd.email, mobile: cd.phone },
        { first_source_channel: 'Direct', status: 'Donor Only' });
      const donation = { amount_cents: obj.amount_total || 0, currency: (obj.currency || 'aud').toUpperCase(),
        stripe_object_type: 'checkout.session', stripe_object_id: obj.id, stripe_payment_intent: obj.payment_intent || '',
        email: cd.email, name: cd.name, phone: cd.phone, petition_slug: obj.client_reference_id || '' };
      const { duplicate } = await AT.logEventIdempotent({ event_type: 'Donation', contactId: contact.id,
        payload: { amount_cents: donation.amount_cents, petition_slug: donation.petition_slug }, meta_event_id: 'stripe_' + obj.id,
        curated: { donation, timestamp: AT.nowISO(), payload: { petition_slug: donation.petition_slug } } });
      if (duplicate) skipped++; else backfilled++;
    }
    return send(res, 200, { scanned: (list.data || []).length, backfilled, skipped });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
