/* POST /api/rally-webhook — Rally Stripe account webhook. Records a ticket +
   Meta Purchase on checkout.session.completed. Manual HMAC (rally secret). */

const { send, readRaw } = require('./_util');
const { verifySignature, stripeGet } = require('./_stripe');
const rally = require('./_rally');
const AT = require('./_airtable');

module.exports.config = { api: { bodyParser: false } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const key = process.env.STRIPE_RALLY_SECRET_KEY;
  const wh = process.env.STRIPE_RALLY_WEBHOOK_SECRET;
  if (!key || !wh) return send(res, 503, { error: 'Rally not configured' });

  const raw = await readRaw(req);
  if (!verifySignature(raw, req.headers['stripe-signature'], wh)) return send(res, 400, { error: 'bad signature' });
  let event = {}; try { event = JSON.parse(raw.toString('utf8')); } catch (e) {}
  if (event.type !== 'checkout.session.completed') return send(res, 200, { received: true, ignored: event.type });

  const obj = event.data && event.data.object;
  const md = obj.metadata || {};
  const cd = obj.customer_details || {};
  await rally.projectRallyTicket({
    stripe_object_id: obj.id, email: cd.email, name: cd.name, phone: cd.phone,
    amount_cents: obj.amount_total || 0, currency: obj.currency,
    adult_qty: parseInt(md.adult_qty || 0, 10), kid_qty: parseInt(md.kid_qty || 0, 10), source: 'stripe',
  });
  if (AT.configured()) {
    try {
      await AT.logEventIdempotent({ event_type: 'Rally Ticket Purchased', payload: { stripe_object_id: obj.id, amount: obj.amount_total }, meta_event_id: 'rally_' + obj.id });
    } catch (e) {}
  }
  rally.fireRallyPurchase({ email: cd.email, phone: cd.phone, name: cd.name, amount_cents: obj.amount_total, currency: obj.currency, event_id: 'rally_' + obj.id });
  return send(res, 200, { received: true });
};
