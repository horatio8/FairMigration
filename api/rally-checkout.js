/* POST /api/rally-checkout — Stripe Embedded Checkout on the Rally account.
   Body { adult_qty, kid_qty, email? }. Returns { client_secret }. */

const { applyCors, send, readJson, PRODUCTION_ORIGIN } = require('./_util');
const { stripePost } = require('./_stripe');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const key = process.env.STRIPE_RALLY_SECRET_KEY;
  if (!key) return send(res, 503, { error: 'Rally not configured' });

  try {
    const b = await readJson(req);
    const adult = Math.max(0, parseInt(b.adult_qty || 0, 10));
    const kid = Math.max(0, parseInt(b.kid_qty || 0, 10));
    if (adult + kid < 1) return send(res, 400, { error: 'Select at least one ticket' });

    const line_items = [];
    if (adult) line_items.push({ price: process.env.STRIPE_RALLY_ADULT_PRICE_ID, quantity: adult });
    if (kid) line_items.push({ price: process.env.STRIPE_RALLY_KID_PRICE_ID, quantity: kid });
    const base = process.env.RALLY_SUCCESS_URL_BASE || (PRODUCTION_ORIGIN + '/rally');

    const session = await stripePost('checkout/sessions', {
      ui_mode: 'embedded', mode: 'payment', line_items,
      return_url: base + '?session_id={CHECKOUT_SESSION_ID}',
      customer_email: b.email || undefined,
      metadata: { adult_qty: adult, kid_qty: kid, source: 'rally' },
    }, key);

    return send(res, 200, { client_secret: session.client_secret, id: session.id });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
