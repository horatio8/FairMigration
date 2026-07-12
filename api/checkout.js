/* POST /api/checkout — create a Stripe Checkout Session (AUD; subscription for
   monthly) and open a Lapse Queue row. GET ?session_id= → thank-you summary.
   GET ?amount= → 303 deep-link (create + redirect). */

const { applyCors, send, readJson, redirect, PRODUCTION_ORIGIN } = require('./_util');
const { stripePost, stripeGet } = require('./_stripe');
const AT = require('./_airtable');
const OPS = require('./_ops');

const ORG = 'Fair Migration';
// Single Stripe Product ("FairMigration") referenced on every charge so all
// donations roll up under one product in the dashboard. Overridable via env.
const PRODUCT_ID = process.env.STRIPE_PRODUCT_ID || 'prod_UrkGRTJxgE7rsz';

function buildSessionForm({ amount, frequency, email, slug, ref, contact_id, sms_variant, utm, origin }) {
  const cents = Math.round(Number(amount) * 100);
  const monthly = frequency === 'monthly';
  // Reference the one "FairMigration" product; fall back to inline product_data
  // if no product id is configured (keeps checkout working out of the box).
  const price_data = { currency: 'aud', unit_amount: cents };
  if (PRODUCT_ID) price_data.product = PRODUCT_ID;
  else price_data.product_data = { name: 'FairMigration', description: monthly ? 'FairMigration — monthly donation' : 'FairMigration — donation' };
  if (monthly) price_data.recurring = { interval: 'month' };
  const dollars = Math.round(cents / 100);
  // Human-readable label so every donation is easy to find/filter in Stripe.
  const description = monthly ? ('FairMigration monthly donation ($' + dollars + '/mo)') : ('FairMigration donation ($' + dollars + ')');
  const metadata = { org: ORG, campaign: 'FairMigration', frequency: frequency || 'oneoff', content_name: 'FairMigration', amount: String(dollars), source_url: origin };
  if (ref) metadata.ref = ref;
  if (contact_id) metadata.contact_id = contact_id;
  if (sms_variant) metadata.sms_variant = sms_variant;
  for (const k in (utm || {})) if (utm[k]) metadata[k] = utm[k];
  // one-off → post-payment monthly upsell on /donate; monthly is already recurring → straight to /share
  const success_url = monthly
    ? origin + '/share.html?session_id={CHECKOUT_SESSION_ID}'
    : origin + '/donate.html?upsell={CHECKOUT_SESSION_ID}';
  const form = {
    mode: monthly ? 'subscription' : 'payment',
    line_items: [{ price_data, quantity: 1 }],
    success_url,
    cancel_url: origin + '/donate.html',
    metadata,
  };
  if (slug) form.client_reference_id = slug;
  if (email) form.customer_email = email;
  // Stamp the charge/subscription itself with the description + metadata so it's
  // filterable in the Payments/Subscriptions lists, not just on the session.
  if (monthly) form.subscription_data = { description, metadata };
  else form.payment_intent_data = { description, metadata };
  return form;
}

async function createSession(params, origin) {
  const form = buildSessionForm(Object.assign({ origin }, params));
  const session = await stripePost('checkout/sessions', form);
  // open a donation lapse row keyed on the session
  try {
    await OPS.createLapse({ form: 'donation', session_id: session.id, email: params.email || '',
      first_name: '', last_name: '', contact_id: params.contact_id || '', amount: Number(params.amount) || 0,
      variant: params.sms_variant || AT.abVariant(session.id) });
  } catch (e) {}
  return session;
}

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  const url = new URL(req.url, 'http://x');

  if (req.method === 'GET') {
    const sid = url.searchParams.get('session_id') || url.searchParams.get('cs');
    if (sid) {
      try {
        const s = await stripeGet('checkout/sessions/' + sid);
        return send(res, 200, { session: { amount_total: s.amount_total, currency: s.currency,
          frequency: (s.metadata && s.metadata.frequency) || 'oneoff', email: (s.customer_details && s.customer_details.email) || s.customer_email, paid: s.payment_status === 'paid' } });
      } catch (e) { return send(res, 404, { error: 'not_found' }); }
    }
    const amount = url.searchParams.get('amount');
    if (amount) {
      const origin = PRODUCTION_ORIGIN;
      try {
        const s = await createSession({ amount, frequency: url.searchParams.get('frequency') || 'oneoff',
          slug: url.searchParams.get('slug'), ref: url.searchParams.get('ref') }, origin);
        return redirect(res, 303, s.url);
      } catch (e) { return send(res, 500, { error: String(e.message || e) }); }
    }
    return send(res, 400, { error: 'missing params' });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const amount = Number(body.amount);
    if (!(amount >= 2 && amount <= 50000)) return send(res, 400, { error: 'Amount must be between $2 and $50,000' });
    const origin = (req.headers.origin && /^https:\/\//.test(req.headers.origin)) ? req.headers.origin : PRODUCTION_ORIGIN;
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => { if (body[k]) utm[k] = body[k]; });
    const session = await createSession({
      amount, frequency: body.frequency === 'monthly' ? 'monthly' : 'oneoff', email: body.email,
      slug: body.slug, ref: body.ref, contact_id: body.contact_id, sms_variant: body.sms_variant, utm,
    }, origin);
    return send(res, 200, { url: session.url, id: session.id });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
