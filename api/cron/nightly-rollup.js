/* GET /api/cron/nightly-rollup (15 18 * * *) — reconcile the signature counter
   against the Contacts table. (Referral Rollup + AB Daily are maintained
   incrementally at write time; this backstops the counter.) */

const { send, requireCron } = require('../_util');
const AT = require('../_airtable');
const OPS = require('../_ops');

module.exports = async (req, res) => {
  if (!requireCron(req, res)) return;
  if (!AT.configured()) return send(res, 200, { skipped: 'no_airtable' });
  try {
    const contacts = await OPS.countTable(AT.T.contacts);
    const before = await AT.getStat('signature_count');
    await AT.setStat('signature_count', contacts);
    return send(res, 200, { reconciled: true, contacts, previous: before ? before.num : null, public: AT.publicSignatureCount(contacts) });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
