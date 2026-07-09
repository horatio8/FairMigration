/* GET /api/cron/refresh-signature-count (callable, key-gated) — recompute the
   signature counter from the Contacts table on demand. */

const { send, requireCron } = require('../_util');
const AT = require('../_airtable');
const OPS = require('../_ops');

module.exports = async (req, res) => {
  if (!requireCron(req, res)) return;
  if (!AT.configured()) return send(res, 200, { skipped: 'no_airtable' });
  try {
    const contacts = await OPS.countTable(AT.T.contacts);
    await AT.setStat('signature_count', contacts);
    return send(res, 200, { raw: contacts, public: AT.publicSignatureCount(contacts) });
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
};
