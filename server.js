
require('dotenv').config();
const express = require('express');
const request = require('request');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// 🌐 Allow only your site to use this API
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "*", // e.g. "https://yourdomain.com"
}));

// ✅ Stream channel map (use environment variables, not hardcoded)
const streams = {
  gma7: process.env.GMA7_URL,
  cinemoph: process.env.CINEMOPH_URL,
  kapamilyachannelHD: process.env.KAPAMILYA_URL,
  gtv: process.env.GTV_URL,
  cinemaoneph: process.env.CINEMAONE_URL,
  alltv2: process.env.ALLTV_URL,
  net25: process.env.NET25_URL,
  teleradyo: process.env.TELERADYO_URL,
  anchd: process.env.ANC_HD_URL,
  myxphilippines: process.env.MYX_PHILIPPINES_URL,
  bilyonaryo: process.env.BILYONARYO_CHANNEL_URL,
  tv5hd: process.env.TV5_HD_URL,
  a2z: process.env.A2Z_URL,
  ibc: process.env.IBC_URL,
  untv: process.env.UNTV_URL,
  ptv4: process.env.PTV4_URL,
  dzrhtv: process.env.DZRH_TV_URL,
  knowledge: process.env.KNOWLEDGE_CHANNELS_URL,
  aliw23: process.env.ALIW_CHANNEL_23_URL,
  cltv36: process.env.CLTV_36_URL,
  spotlight: process.env.SPOTLIGHT_TV_URL,
  rjtv: process.env.RJ_TV_URL,
  rjtv29: process.env.RJTV_29_URL,
  onemedia: process.env.ONE_MEDIA_URL,
  lachtv: process.env.LACH_TV_URL,
  oneph: process.env.ONE_PH_URL,
  onenews: process.env.ONE_NEWS_URL,
  vivacinema: process.env.VIVA_CINEMA_URL,
  pbo: process.env.PBO_URL,
  star1: process.env.STAR_1_URL,
  cinemaworld: process.env.CINEMAWORLD_URL,
};

// 🔒 Temporary segment token map
const segmentMap = new Map();

// 📺 Proxy M3U8 playlists
app.get('/:stream/manifest.m3u8', (req, res) => {
  const key = req.params.stream;
  const streamUrl = streams[key];
  if (!streamUrl) return res.status(404).send('❌ Invalid stream key');

  const baseUrl = new URL(streamUrl);
  const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

  request.get(streamUrl, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(502).send('❌ Failed to fetch playlist');
    }

    let i = 0;
    const modified = body.replace(/^(?!#)(.+)$/gm, (line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return line;
      const fullUrl = new URL(line, basePath).href;

      // 🔑 Generate a unique token
      const token = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i++}`;
      segmentMap.set(token, fullUrl);

      // Auto-expire token after 60s
      setTimeout(() => segmentMap.delete(token), 60000);

      return `/segment.ts?token=${token}`;
    });

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(modified);
  });
});

// 🎬 Proxy segment.ts with token lookup
app.get('/segment.ts', (req, res) => {
  const token = req.query.token;
  const segmentUrl = segmentMap.get(token);

  if (!segmentUrl) return res.status(400).send('❌ Invalid or expired token');

  request
    .get(segmentUrl)
    .on('response', (r) => res.set(r.headers))
    .on('error', () => res.status(502).send('❌ Segment failed'))
    .pipe(res);
});

// 🌐 Root
app.get('/', (req, res) => {
  res.send('WELCOME TO HONOR TV');
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
