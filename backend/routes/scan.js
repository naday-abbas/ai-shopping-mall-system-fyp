import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import Product from '../models/Product.js';
import Session from '../models/Session.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const sleep = ms => new Promise(r => setTimeout(r, ms));


async function waitForAI(baseUrl, maxAttempts = 20, delayMs = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data } = await axios.get(`${baseUrl}/health`, {
        timeout: 10000,
      });

      if (data?.status === 'ok') {
        console.log('[AI] Service is ready.');
        return;
      }

      lastError = new Error('AI service is not ready yet.');
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // Retry network errors and temporary Render startup errors.
      if (status && ![502, 503, 504].includes(status)) {
        throw err;
      }
    }

    if (attempt < maxAttempts) {
      console.warn(
        `[AI] Waiting for startup (${attempt}/${maxAttempts})...`
      );
      await sleep(delayMs);
    }
  }

  const error = new Error(
    `AI service failed to become ready: ${lastError?.message || 'Unknown error'}`
  );
  error.status = 503;
  throw error;
}


router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    
    // ── 1. Wake AI service and wait until it is ready ───────────────────
    const aiBaseUrl = (
      process.env.AI_SERVICE_URL ?? 'http://127.0.0.1:8000'
    ).trim().replace(/\/+$/, '');

    console.log('[AI] Checking service readiness...');
    await waitForAI(aiBaseUrl);

    // ── 2. Forward image to Python AI service ──────────────────────────
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype,
    });

    const aiUrl = `${aiBaseUrl}/predict`;

    console.log('[AI] Sending image for prediction:', aiUrl);

    const { data: ai } = await axios.post(aiUrl, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });


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
