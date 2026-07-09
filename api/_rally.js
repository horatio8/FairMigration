/* Rally ticketing helpers — projection into Rally Tickets + Meta Purchase.
   Runs on a SEPARATE Stripe account (STRIPE_RALLY_* env). */

const AT = require('./_airtable');
const meta = require('./_meta');

async function projectRallyTicket({ stripe_object_id, email, name, phone, amount_cents, currency, adult_qty, kid_qty, comped, source }) {
  const fields = {
    ticket_id: AT.uuid(), stripe_object_id: stripe_object_id || '', email: email || '', name: name || '', phone: phone || '',
    amount_cents: amount_cents || 0, amount: (amount_cents || 0) / 100, currency: (currency || 'aud').toUpperCase(),
    adult_qty: adult_qty || 0, kid_qty: kid_qty || 0, comped: !!comped, source: source || 'stripe', timestamp: AT.nowISO(),
  };
  try { return await AT.createRecord(AT.T.rallyTickets, fields); } catch (e) { return null; }
}

function fireRallyPurchase({ email, phone, name, amount_cents, currency, event_id }) {
  return meta.sendEvent({
    event_name: 'Purchase', event_id,
    user: { email, phone, first_name: (name || '').split(' ')[0], external_id: email, country: 'AU' },
    custom_data: { currency: (currency || 'aud').toUpperCase(), value: (amount_cents || 0) / 100, content_name: 'Rally ticket' },
  }).catch(() => {});
}

module.exports = { projectRallyTicket, fireRallyPurchase };
