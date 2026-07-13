/* GET /api/geo — coarse location from Vercel's edge geo headers, used to adapt
   the petition postcode to the signer's state (NSW→2xxx, VIC→3xxx, QLD→4xxx …).
   No external service; returns empty fields off-Vercel or outside Australia. */

const { applyCors, send } = require('./_util');

// Capital-city postcode per state — its leading digit is the state's postcode prefix.
const STATE_POSTCODE = { NSW: '2000', ACT: '2600', VIC: '3000', QLD: '4000', SA: '5000', WA: '6000', TAS: '7000', NT: '0800' };

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase();
  let region = String(req.headers['x-vercel-ip-country-region'] || '').toUpperCase();
  if (region.includes('-')) region = region.split('-').pop(); // "AU-NSW" → "NSW"
  const sample = country === 'AU' ? (STATE_POSTCODE[region] || '') : '';
  res.setHeader('Cache-Control', 'no-store');
  return send(res, 200, {
    country, region: sample ? region : '', state: sample ? region : '',
    sample_postcode: sample, postcode_prefix: sample ? sample[0] : '',
  });
};
