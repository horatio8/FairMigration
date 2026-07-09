/* GET /api/youtube — recent videos from the channel RSS feed, edge-cached.
   Set YOUTUBE_CHANNEL_ID. Returns { videos: [{id,title,published,url,thumbnail}] }. */

const { applyCors, send } = require('./_util');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  const channel = process.env.YOUTUBE_CHANNEL_ID;
  if (!channel) return send(res, 200, { videos: [] });
  try {
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(channel));
    const xml = await r.text();
    const videos = [];
    const entries = xml.split('<entry>').slice(1);
    for (const e of entries.slice(0, 12)) {
      const id = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
      const title = (e.match(/<title>([^<]+)<\/title>/) || [])[1];
      const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
      if (!id) continue;
      videos.push({ id, title, published, url: 'https://www.youtube.com/watch?v=' + id, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
    }
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return send(res, 200, { videos });
  } catch (err) {
    return send(res, 200, { videos: [], error: String(err.message || err) });
  }
};
