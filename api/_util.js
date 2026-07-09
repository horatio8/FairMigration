/* Shared serverless helpers — CORS, body parsing, JSON responses.
   Zero npm dependencies (Node built-ins only) so functions run with no install. */

const DEFAULT_ORIGINS = [
  'https://fairmigration.vote',
  'https://www.fairmigration.vote',
];

function allowedOrigins() {
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return DEFAULT_ORIGINS.concat(extra);
}

function isAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  // Vercel preview deployments + localhost
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) || /^http:\/\/localhost(:\d+)?$/i.test(origin);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (isAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

// Vercel auto-parses JSON bodies; fall back to manual read if not.
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = await readRaw(req);
  if (!raw || !raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); } catch (e) { return {}; }
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

const PRODUCTION_ORIGIN = process.env.PRODUCTION_ORIGIN || 'https://fairmigration.vote';

const crypto = require('crypto');
function safeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Vercel cron sends Authorization: Bearer <CRON_SECRET>. Crons run in production only.
function requireCron(req, res) {
  const secret = process.env.CRON_SECRET;
  const hdr = req.headers.authorization || '';
  const ok = secret && hdr === 'Bearer ' + secret;
  // allow ?key= for manual/callable crons
  const url = new URL(req.url, 'http://x');
  const keyOk = secret && url.searchParams.get('key') === secret;
  if (!ok && !keyOk) { send(res, 401, { error: 'unauthorized' }); return false; }
  return true;
}

// Basic-auth gate against ADMIN_BASIC_AUTH="user:pass".
function requireBasicAuth(req, res) {
  const expected = process.env.ADMIN_BASIC_AUTH;
  const hdr = req.headers.authorization || '';
  if (expected && hdr.startsWith('Basic ')) {
    const decoded = Buffer.from(hdr.slice(6), 'base64').toString('utf8');
    if (safeEqual(decoded, expected)) return true;
  }
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  res.end('Authentication required');
  return false;
}

// Flatten an object into x-www-form-urlencoded with Stripe bracket notation.
function toFormBody(obj, prefix) {
  const parts = [];
  for (const key in obj) {
    const val = obj[key];
    if (val === undefined || val === null) continue;
    const k = prefix ? prefix + '[' + key + ']' : key;
    if (typeof val === 'object' && !Array.isArray(val)) parts.push(toFormBody(val, k));
    else if (Array.isArray(val)) val.forEach((v, i) => {
      if (typeof v === 'object') parts.push(toFormBody(v, k + '[' + i + ']'));
      else parts.push(encodeURIComponent(k + '[' + i + ']') + '=' + encodeURIComponent(v));
    });
    else parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(val));
  }
  return parts.filter(Boolean).join('&');
}

function sendHtml(res, code, html) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}
function redirect(res, code, location) {
  res.statusCode = code;
  res.setHeader('Location', location);
  res.end();
}

module.exports = { applyCors, send, sendHtml, redirect, readJson, readRaw, clientIp, safeEqual,
  requireCron, requireBasicAuth, toFormBody, PRODUCTION_ORIGIN };
