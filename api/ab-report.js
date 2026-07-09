/* GET /api/ab-report (basic-auth) — A/B results from AB Daily.
   Metric = revenue per 1,000 sends. ?html=1 for a table, else JSON. */

const { send, sendHtml, requireBasicAuth } = require('./_util');
const AT = require('./_airtable');
const OPS = require('./_ops');

module.exports = async (req, res) => {
  if (!requireBasicAuth(req, res)) return;
  if (!AT.configured()) return send(res, 503, { error: 'Backend not configured' });
  const url = new URL(req.url, 'http://x');

  const rows = await OPS.listRecords(AT.T.abDaily, 'pageSize=100');
  const agg = {}; // test → variant → totals
  for (const r of rows) {
    const f = r.fields; const test = f.test || 'unknown', v = f.variant || '?';
    agg[test] = agg[test] || {};
    const a = agg[test][v] = agg[test][v] || { sends: 0, clicks: 0, gifts: 0, revenue: 0, optouts: 0 };
    a.sends += Number(f.sends) || 0; a.clicks += Number(f.clicks) || 0; a.gifts += Number(f.gifts) || 0;
    a.revenue += Number(f.revenue) || 0; a.optouts += Number(f.optouts) || 0;
  }
  const report = [];
  for (const test in agg) for (const v in agg[test]) {
    const a = agg[test][v];
    report.push({ test, variant: v, ...a, rev_per_1k_sends: a.sends ? +(a.revenue / a.sends * 1000).toFixed(2) : 0 });
  }
  report.sort((x, y) => x.test.localeCompare(y.test) || x.variant.localeCompare(y.variant));

  if (url.searchParams.get('html') !== '1') return send(res, 200, { report });

  const body = report.map((r) => `<tr><td>${r.test}</td><td>${r.variant}</td><td>${r.sends}</td><td>${r.clicks}</td><td>${r.gifts}</td><td>$${Number(r.revenue).toLocaleString()}</td><td>${r.optouts}</td><td><b>$${r.rev_per_1k_sends}</b></td></tr>`).join('');
  const html = `<!doctype html><meta charset=utf-8><title>A/B report</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px}
table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:left}
th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}</style>
<h1>A/B report</h1><p>Metric: revenue per 1,000 sends.</p>
<table><thead><tr><th>Test</th><th>Variant</th><th>Sends</th><th>Clicks</th><th>Gifts</th><th>Revenue</th><th>Opt-outs</th><th>$/1k</th></tr></thead><tbody>${body || '<tr><td colspan=8>No data yet.</td></tr>'}</tbody></table>`;
  return sendHtml(res, 200, html);
};
