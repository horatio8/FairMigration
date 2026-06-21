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

module.exports = { applyCors, send, readJson, readRaw, clientIp, PRODUCTION_ORIGIN };
