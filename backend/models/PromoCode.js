import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    // Locked to the kiosk-wide reward tiers — matches Event.discountPercent
    discountPercent: { type: Number, required: true, enum: [5, 10, 15, 20, 25, 30] },
    isRedeemed: { type: Boolean, default: false },
    redeemedAt: { type: Date, default: null },
    // Which session won this code (optional — game-generated codes have no session)
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    expiresAt: { type: Date, required: true },
    // Carried forward from the session that generated this coupon — see Session.visitStreak
    visitStreak: { type: Number, default: 1 },
    // Calendar date (Pakistan time, YYYY-MM-DD) this streak was last advanced on —
    // re-entering the same code again on the same day does not count as a new visit.
    lastVisitDate: { type: String, default: null },
    // One-time physical reward unlocked on the 3rd distinct-day visit, collected in-store
    hamperEligible:    { type: Boolean, default: false },
    hamperCollected:   { type: Boolean, default: false },
    hamperCollectedAt: { type: Date, default: null },
    // Which mini-game generated this coupon, and the score (only meaningful for catch-gifts)
    gameType:  { type: String, enum: ['spin', 'catch-gifts'], default: 'spin' },
    gameScore: { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('PromoCode', promoCodeSchema);
