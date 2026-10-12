import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import Product from '../models/Product.js';
import Session from '../models/Session.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function postToAI(url, form, retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, form, { headers: form.getHeaders() });
    } catch (err) {
      const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET';
      if (isConnRefused && attempt < retries) {
        console.warn(`[AI] not ready, retrying in ${delayMs / 1000}s (attempt ${attempt}/${retries})…`);
        await sleep(delayMs);
      } else {
        throw err;
      }
    }
  }
}

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    // ── 1. Forward image to Python AI service ──────────────────────────────
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype,
    });

    const aiBaseUrl = (
      process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8000'
    ).trim().replace(/\/+$/, '');
    
    const aiUrl = `${aiBaseUrl}/predict`;
    
    console.log('[AI] Requesting:', aiUrl);
        const { data: ai } = await postToAI(aiUrl, form);

    // ── 2. Query MongoDB for matching products ─────────────────────────────
    const weatherCondition = req.body.weatherCondition || 'All'
    // When condition is 'All' (cloudy/fallback), skip weather filter so all
    // demographic-matched products are returned (general promotional offers).
    const weatherFilter = weatherCondition !== 'All'
      ? { targetWeather: { $in: [weatherCondition, 'All'] } }
      : {}

    const products = await Product.aggregate([
      {
        $match: {
          isActive: true,
          targetDemographics: {
            $elemMatch: {
              age:    { $in: [ai.age_category, 'All'] },
              gender: { $in: [ai.gender, 'All'] },
            },
          },
          ...weatherFilter,
        },
      },
      // Sort within each category by least-recently-shown first, so every
      // product in rotation gets a turn before any repeats.
      { $sort: { viewCount: 1, createdAt: 1, _id: 1 } },
      {
        $group: {
          _id: '$category',
          item: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$item' } },
    ]);

    // ── 2b. Mark selected products as viewed ────────────────────────────────
    if (products.length) {
      const productIds = products.map(p => p._id);
      await Product.updateMany({ _id: { $in: productIds } }, { $inc: { viewCount: 1 } });
      products.forEach(p => { p.viewCount = (p.viewCount || 0) + 1; });
    }

    // ── 3. Log session to MongoDB ──────────────────────────────────────────
    let sessionId = null;
    try {
      const visitStreak = Math.max(1, Number(req.body.visitStreak) || 1);
      const session = await Session.create({
        detectedAge:      ai.age_category,
        detectedGender:   ai.gender,
        ageConfidence:    ai.age_confidence,
        genderConfidence: ai.gender_confidence,
        lastState:        'recommendations',
        visitStreak,
      });
      sessionId = session._id;
    } catch (err) {
      console.error('[Session] log error:', err.message);
    }

    // ── 4. Return combined payload ─────────────────────────────────────────
    return res.json({
      success:           true,
      age_category:      ai.age_category,
      gender:            ai.gender,
      age_confidence:    ai.age_confidence,
      gender_confidence: ai.gender_confidence,
      sessionId,
      products,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
