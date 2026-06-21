/* Stripe helpers — manual HMAC signature verification (never trust the SDK in
   serverless cold starts) and minimal REST reads. No SDK dependency. */

const https = require('https');
const crypto = require('crypto');

const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Verify a Stripe-Signature header against the raw body. 5-minute skew tolerance.
function verifySignature(rawBody, sigHeader) {
  if (!WEBHOOK_SECRET || !sigHeader) return false;
  const parts = {};
  String(sigHeader).split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i === -1) return;
    const k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim();
    (parts[k] = parts[k] || []).push(v);
  });
  const t = parts.t && parts.t[0];
  const sigs = parts.v1 || [];
  if (!t || !sigs.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > 300) return false;
  const payload = t + '.' + (Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload, 'utf8').digest('hex');
  const eBuf = Buffer.from(expected);
  return sigs.some((s) => { const sBuf = Buffer.from(s); return sBuf.length === eBuf.length && crypto.timingSafeEqual(sBuf, eBuf); });
}

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    if (!SECRET) { reject(new Error('STRIPE_SECRET_KEY not set')); return; }
    const req = https.request({
      hostname: 'api.stripe.com', path: '/v1/' + path, method: 'GET',
      headers: { Authorization: 'Bearer ' + SECRET },
    }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(j);
        else reject(new Error('Stripe ' + res.statusCode + ': ' + (j.error && j.error.message)));
      });
    });
    req.on('error', reject); req.end();
  });
}

module.exports = { verifySignature, stripeGet };
