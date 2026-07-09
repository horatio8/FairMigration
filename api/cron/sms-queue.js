/* GET /api/cron/sms-queue (callable, key-gated) — drain due queued SMS via the
   self-dispatcher. Useful between lapse-sweep runs. */

const { send, requireCron } = require('../_util');
const AT = require('../_airtable');
const cellcast = require('../_cellcast');

module.exports = async (req, res) => {
  if (!requireCron(req, res)) return;
  if (!AT.configured()) return send(res, 200, { skipped: 'no_airtable' });
  const r = await cellcast.dispatchDueSMS();
  return send(res, 200, r);
};
