import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/feedback — save kiosk survey response
router.post('/', async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be 1–5.' });
    }

    const payload = { rating };
    if (req.body.satisfied         !== undefined) payload.satisfied         = Boolean(req.body.satisfied);
    if (req.body.ageGenderAccurate !== undefined) payload.ageGenderAccurate = Boolean(req.body.ageGenderAccurate);

    const feedback = await Feedback.create(payload);
    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback — retrieve all feedback (for dashboard)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
