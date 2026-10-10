import { Router } from 'express';
import PromoCode from '../models/PromoCode.js';

const router = Router();

// Pakistan is fixed at UTC+5 (no DST) — shift before taking the calendar date.
function todayInPK() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// POST /api/visitors/lookup — customer voluntarily re-enters a coupon code they
// were shown on a previous visit. No identity is stored anywhere — this only
// chains an anonymous visit counter forward through codes the customer already has.
// A visit only counts once per calendar day, so re-entering the same code
// repeatedly in one sitting can't be used to game the streak.
router.post('/lookup', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'A coupon code is required.' });
    }

    const previous = await PromoCode.findOne({ code: code.trim().toUpperCase() });
    if (!previous) {
      return res.status(404).json({ success: false, error: 'Code not found.' });
    }

    const today = todayInPK();
    const sameDay = previous.lastVisitDate === today;
    const visitStreak = sameDay ? (previous.visitStreak || 1) : (previous.visitStreak || 1) + 1;

    res.json({ success: true, visitStreak, sameDay });
  } catch (err) {
    next(err);
  }
});

export default router;
