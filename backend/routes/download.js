import { Router } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

router.get('/', (req, res) => {
  const { url, name = 'image' } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  const protocol = url.startsWith('https') ? https : http;

  const request = protocol.get(url, (imgRes) => {
    if (imgRes.statusCode !== 200) {
      return res.status(502).json({ error: `Upstream returned ${imgRes.statusCode}` });
    }

    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    const ext = contentType.includes('svg') ? 'svg'
              : contentType.includes('png') ? 'png'
              : contentType.includes('gif') ? 'gif'
              : 'jpg';

    const safeName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    const filename = `${safeName}.${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    imgRes.pipe(res);
  });

  request.on('error', () => res.status(500).json({ error: 'Failed to fetch image' }));
  request.setTimeout(10000, () => {
    request.destroy();
    res.status(504).json({ error: 'Request timed out' });
  });
});

export default router;
