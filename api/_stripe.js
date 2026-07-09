/* Stripe helpers — manual HMAC signature verification (never trust the SDK in
   serverless cold starts) and minimal REST. No SDK dependency.
   Supports a per-account key override so the Rally flow can use a separate account. */

const https = require('https');
const crypto = require('crypto');
const { toFormBody } = require('./_util');

const SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Verify a Stripe-Signature header against the raw body. 5-minute skew tolerance.
function verifySignature(rawBody, sigHeader, secretOverride) {
  const secret = secretOverride || WEBHOOK_SECRET;
  if (!secret || !sigHeader) return false;
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
  const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const eBuf = Buffer.from(expected);
  return sigs.some((s) => { const sBuf = Buffer.from(s); return sBuf.length === eBuf.length && crypto.timingSafeEqual(sBuf, eBuf); });
}

function request(method, path, { key, form } = {}) {
  return new Promise((resolve, reject) => {
    const secret = key || SECRET;
    if (!secret) { reject(new Error('Stripe secret key not set')); return; }
    const data = form ? toFormBody(form) : null;
    const req = https.request({
      hostname: 'api.stripe.com', path: '/v1/' + path, method,
      headers: Object.assign({ Authorization: 'Bearer ' + secret },
        data ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {}),
    }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(j);
        else reject(new Error('Stripe ' + res.statusCode + ': ' + (j.error && j.error.message)));
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const stripeGet = (path, key) => request('GET', path, { key });
const stripePost = (path, form, key) => request('POST', path, { form, key });

module.exports = { verifySignature, stripeGet, stripePost };
