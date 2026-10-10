import { Router } from 'express';
import PromoCode from '../models/PromoCode.js';
import Session from '../models/Session.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Pakistan is fixed at UTC+5 (no DST) — shift before taking the calendar date.
function todayInPK() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Every discount in the project — games, events, coupons — is locked to these tiers
const ALLOWED_DISCOUNTS = [5, 10, 15, 20, 25, 30];

// POST /api/coupons — generate and save a new promo code (called by the game)
// POST /api/coupons — generate and save a new promo code
router.post('/', async (req, res, next) => {
  try {
    const { discount, sessionId, gameType, gameScore } = req.body;
    const pct = Number(discount);

    if (!ALLOWED_DISCOUNTS.includes(pct)) {
      return res.status(400).json({ success: false, error: `Discount must be one of ${ALLOWED_DISCOUNTS.join(', ')}.` });
    }
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const suffix = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const code = `SAVE${pct}${suffix}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let visitStreak = 1;
    if (sessionId) {
      const session = await Session.findById(sessionId).select('visitStreak');
      if (session?.visitStreak) visitStreak = session.visitStreak;
    }

    const coupon = await PromoCode.create({
      code,
      discountPercent: pct,
      expiresAt,
      sessionId: sessionId || null,
      visitStreak,
      lastVisitDate: todayInPK(),
      // One-time reward — only fires on the exact 3rd distinct-day visit, not every visit after.
      hamperEligible: visitStreak === 3,
      gameType: gameType === 'catch-gifts' ? 'catch-gifts' : 'spin',
      gameScore: gameType === 'catch-gifts' ? (Number(gameScore) || 0) : null,
    });

    if (sessionId) {
      Session.findByIdAndUpdate(sessionId, { lastState: 'gamification' })
        .catch(err => console.error('[Session] lastState update error:', err.message));
    }

    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});


// GET /api/coupons — list all promo codes, newest first; populate session demographics
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const coupons = await PromoCode.find()
      .populate('sessionId', 'detectedGender detectedAge')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
});

// PUT /api/coupons/:id/use — mark a coupon as redeemed
router.put('/:id/use', requireAdmin, async (req, res, next) => {
  try {
    const coupon = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { isRedeemed: true, redeemedAt: new Date() },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ success: false, error: 'Coupon not found.' });
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

// PUT /api/coupons/:id/collect-hamper — staff marks a gift hamper as handed over in-store
router.put('/:id/collect-hamper', requireAdmin, async (req, res, next) => {
  try {
    const coupon = await PromoCode.findOneAndUpdate(
      { _id: req.params.id, hamperEligible: true },
      { hamperCollected: true, hamperCollectedAt: new Date() },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ success: false, error: 'No eligible hamper found for this coupon.' });
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

export default router;
