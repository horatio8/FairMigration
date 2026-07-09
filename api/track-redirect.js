/* GET /api/track-redirect — the /fund and /fight SMS links land here.
   Logs an SMS Click (unless a preview bot) and 302s to the donate page. */

const { send, redirect } = require('./_util');
const AT = require('./_airtable');

const BOT_RE = /facebookexternalhit|twitterbot|slackbot|whatsapp|telegrambot|linkedinbot|discordbot|bingpreview|googlebot|embedly|redditbot|pinterest|bot\b|crawler|spider|preview/i;

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const l = url.searchParams.get('l') || 'fund';        // fund | fight
  const c = url.searchParams.get('c') || '';            // referral code
  const utm_content = l === 'fight' ? 'issue' : 'ben';
  const ua = req.headers['user-agent'] || '';
  const isBot = BOT_RE.test(ua);

  if (!isBot && AT.configured()) {
    try {
      const referrer = c ? await AT.resolveReferrerByCode(c) : null;
      await AT.logEvent({
        event_type: 'SMS Click', contactId: referrer ? referrer.id : undefined,
        payload: { link: l, utm_content, c, ua }, referral_code_used: c, source_channel: 'Referral',
      });
    } catch (e) {}
  }

  const dest = '/donate.html?utm_source=sms&utm_medium=auto&utm_content=' + encodeURIComponent(utm_content) + (c ? '&c=' + encodeURIComponent(c) + '&ref=' + encodeURIComponent(c) : '');
  return redirect(res, 302, dest);
};
