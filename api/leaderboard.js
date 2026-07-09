/* GET /leaderboard (basic-auth) — top referrers from Referral Rollup.
   ?json=1 for JSON, otherwise a simple HTML table. */

const { send, sendHtml, requireBasicAuth } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');

module.exports = async (req, res) => {
  if (!requireBasicAuth(req, res)) return;
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });
  const url = new URL(req.url, 'http://x');

  const q = 'pageSize=50&sort%5B0%5D%5Bfield%5D=signups&sort%5B0%5D%5Bdirection%5D=desc';
  const rows = await OPS.listRecords(AT.T.rollup, q);
  const data = rows.map((r) => ({ code: r.fields.code, signups: r.fields.signups || 0, donations: r.fields.donations || 0, dollars: r.fields.dollars || 0 }));

  if (url.searchParams.get('json') === '1') return send(res, 200, { leaders: data });

  const body = data.map((d, i) => `<tr><td>${i + 1}</td><td><code>${d.code}</code></td><td>${d.signups}</td><td>${d.donations}</td><td>$${Number(d.dollars).toLocaleString()}</td></tr>`).join('');
  const html = `<!doctype html><meta charset=utf-8><title>Referral leaderboard</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px}
table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:left}
th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}code{background:#f3f4f6;padding:2px 6px;border-radius:4px}</style>
<h1>Referral leaderboard</h1><table><thead><tr><th>#</th><th>Code</th><th>Signups</th><th>Donations</th><th>Raised</th></tr></thead><tbody>${body || '<tr><td colspan=5>No data yet.</td></tr>'}</tbody></table>`;
  return sendHtml(res, 200, html);
};
