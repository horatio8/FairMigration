/* Operational-table helpers: Lapse Queue, SMS Sends/Replies, Referral Rollup,
   AB Daily. Thin CRUD over the shared Airtable client. */

const AT = require('./_airtable');
const { T, findOne, createRecord, updateRecord, uuid, nowISO, esc } = AT;

/* ---------- Lapse Queue ---------- */
async function createLapse(fields) {
  return createRecord(T.lapse, Object.assign({ lapse_id: uuid(), status: 'pending', created_at: nowISO() }, fields));
}
async function findDueLapses(cutoffISO, max = 40) {
  const q = 'filterByFormula=' + encodeURIComponent(`AND({status}='pending', IS_BEFORE({created_at}, '${cutoffISO}'))`) +
    '&maxRecords=' + max + '&sort%5B0%5D%5Bfield%5D=created_at';
  return listRecords(T.lapse, q);
}
async function findPendingLapse(match) {
  // match by session_id (donation) or email+form (petition)
  if (match.session_id) return findOne(T.lapse, `AND({status}='pending', {session_id}='${esc(match.session_id)}')`);
  if (match.email && match.form) return findOne(T.lapse, `AND({status}='pending', {form}='${esc(match.form)}', LOWER({email})='${esc(String(match.email).toLowerCase())}')`);
  return null;
}
const updateLapse = (id, patch) => updateRecord(T.lapse, id, patch);

/* ---------- SMS Sends ---------- */
async function createSmsSend(fields) {
  return createRecord(T.smsSends, Object.assign({ send_id: uuid(), queued_at: nowISO() }, fields));
}
async function findQueuedSend(phone_hash, template) {
  return findOne(T.smsSends, `AND({phone_hash}='${esc(phone_hash)}', {template}='${esc(template)}', OR({status}='queued',{status}='scheduled',{status}='sent'))`);
}
async function findDueSends(horizonISO, max = 25) {
  const q = 'filterByFormula=' + encodeURIComponent(`AND({status}='queued', IS_BEFORE({not_before}, '${horizonISO}'))`) +
    '&maxRecords=' + max + '&sort%5B0%5D%5Bfield%5D=not_before';
  return listRecords(T.smsSends, q);
}
const updateSmsSend = (id, patch) => updateRecord(T.smsSends, id, patch);

/* ---------- SMS Replies (idempotent on reply_id) ---------- */
async function upsertReply(reply_id, fields) {
  const existing = await findOne(T.smsReplies, `{reply_id}='${esc(reply_id)}'`);
  if (existing) return { record: existing, duplicate: true };
  const rec = await createRecord(T.smsReplies, Object.assign({ reply_id }, fields));
  return { record: rec, duplicate: false };
}

/* ---------- Referral Rollup ---------- */
async function upsertRollup(code, d) {
  const existing = await findOne(T.rollup, `{code}='${esc(code)}'`);
  const cur = existing ? existing.fields : {};
  const next = {
    signups: (Number(cur.signups) || 0) + (d.signups || 0),
    donations: (Number(cur.donations) || 0) + (d.donations || 0),
    dollars: (Number(cur.dollars) || 0) + (d.dollars || 0),
    updated_at: nowISO(),
  };
  if (existing) return updateRecord(T.rollup, existing.id, next);
  return createRecord(T.rollup, Object.assign({ code }, next));
}

/* ---------- AB Daily ---------- */
async function upsertAbDaily(date, test, variant, d) {
  const row_id = `${date}|${test}|${variant}`;
  const existing = await findOne(T.abDaily, `{row_id}='${esc(row_id)}'`);
  const cur = existing ? existing.fields : {};
  const next = {
    date, test, variant,
    sends: (Number(cur.sends) || 0) + (d.sends || 0),
    clicks: (Number(cur.clicks) || 0) + (d.clicks || 0),
    gifts: (Number(cur.gifts) || 0) + (d.gifts || 0),
    revenue: (Number(cur.revenue) || 0) + (d.revenue || 0),
    optouts: (Number(cur.optouts) || 0) + (d.optouts || 0),
    updated_at: nowISO(),
  };
  if (existing) return updateRecord(T.abDaily, existing.id, next);
  return createRecord(T.abDaily, Object.assign({ row_id }, next));
}

/* ---------- generic list ---------- */
function listRecords(table, query) {
  // reuse the low-level request via a tiny GET
  return AT.__list ? AT.__list(table, query) : rawList(table, query);
}
const https = require('https');
function rawList(table, query) {
  return new Promise((resolve, reject) => {
    const path = '/v0/' + encodeURIComponent(process.env.AIRTABLE_BASE_ID) + '/' + encodeURIComponent(table) + '?' + query;
    const req = https.request({ hostname: 'api.airtable.com', path, method: 'GET',
      headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_API_KEY } }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => { let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {} resolve(j.records || []); });
    });
    req.on('error', reject); req.end();
  });
}

// Count records in a table via pagination (bounded).
function pageOnce(table, offset) {
  return new Promise((resolve, reject) => {
    let path = '/v0/' + encodeURIComponent(process.env.AIRTABLE_BASE_ID) + '/' + encodeURIComponent(table) + '?pageSize=100&fields%5B%5D=';
    if (offset) path += '&offset=' + encodeURIComponent(offset);
    const req = https.request({ hostname: 'api.airtable.com', path, method: 'GET',
      headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_API_KEY } }, (res) => {
      const chunks = []; res.on('data', (c) => chunks.push(c));
      res.on('end', () => { let j = {}; try { j = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {} resolve({ n: (j.records || []).length, offset: j.offset }); });
    });
    req.on('error', reject); req.end();
  });
}
async function countTable(table, maxPages = 200) {
  let total = 0, offset = null, pages = 0;
  do { const r = await pageOnce(table, offset); total += r.n; offset = r.offset; pages++; } while (offset && pages < maxPages);
  return total;
}

module.exports = {
  createLapse, findDueLapses, findPendingLapse, updateLapse,
  createSmsSend, findQueuedSend, findDueSends, updateSmsSend,
  upsertReply, upsertRollup, upsertAbDaily, listRecords, countTable,
};
