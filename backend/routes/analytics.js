import { Router } from 'express';
import Session from '../models/Session.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics — aggregated stats for the admin dashboard
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const GAME_STATES = ['gamification', 'survey', 'complete'];

    const [
      totalSessions, totalProducts, totalCoupons, totalGames,
      genderAgg, ageAgg, dailyAgg, dailyGamesAgg,
      gameByGenderAgg, gameByAgeAgg, couponDiscountAgg, hourlyAgg, frequentVisitorAgg,
      gameTypeAgg, catchGiftsStatsAgg,
    ] = await Promise.all([
      Session.countDocuments(),
      Product.countDocuments({ isActive: true }),
      PromoCode.countDocuments(),
      Session.countDocuments({ lastState: { $in: GAME_STATES } }),
      Session.aggregate([{ $group: { _id: '$detectedGender', value: { $sum: 1 } } }]),
      Session.aggregate([{ $group: { _id: '$detectedAge',    value: { $sum: 1 } } }]),
      Session.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Session.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, lastState: { $in: GAME_STATES } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Session.aggregate([
        { $match: { lastState: { $in: GAME_STATES } } },
        { $group: { _id: '$detectedGender', value: { $sum: 1 } } },
      ]),
      Session.aggregate([
        { $match: { lastState: { $in: GAME_STATES } } },
        { $group: { _id: '$detectedAge', value: { $sum: 1 } } },
      ]),
      PromoCode.aggregate([
        { $group: { _id: '$discountPercent', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Hour-of-day breakdown (Pakistan local time, UTC+5) — powers the Peak Activity Hours chart
      Session.aggregate([
        { $group: { _id: { $hour: { date: '$createdAt', timezone: '+05:00' } }, count: { $sum: 1 } } },
      ]),
      // Normal (visitStreak <= 3) vs Frequent (> 3) visitors, based on the opt-in coupon-code streak
      PromoCode.aggregate([
        { $group: { _id: { $cond: [{ $gt: ['$visitStreak', 3] }, 'Frequent', 'Normal'] }, value: { $sum: 1 } } },
      ]),
      // Spin & Win vs Catch-the-Gifts — which mini-game was played
      PromoCode.aggregate([
        { $group: { _id: '$gameType', value: { $sum: 1 } } },
      ]),
      // Catch-the-Gifts performance — average/best score, kid engagement
      PromoCode.aggregate([
        { $match: { gameType: 'catch-gifts' } },
        { $group: { _id: null, avgScore: { $avg: '$gameScore' }, maxScore: { $max: '$gameScore' }, plays: { $sum: 1 } } },
      ]),
    ]);

    const genderDistribution = genderAgg.map(g => ({ name: g._id, value: g.value }));
    const ageDistribution = ['Kid', 'Young', 'Adult', 'Senior'].map(label => ({
      name: label,
      value: ageAgg.find(a => a._id === label)?.value ?? 0,
    }));
    const gamesMap = Object.fromEntries(dailyGamesAgg.map(d => [d._id, d.count]));
    const dailyActivity = dailyAgg.map(d => ({
      date: d._id,
      count: d.count,
      games: gamesMap[d._id] ?? 0,
    }));
    const gameByGender = gameByGenderAgg.map(g => ({ name: g._id, value: g.value }));
    const gameByAge    = ['Kid', 'Young', 'Adult', 'Senior'].map(label => ({
      name: label,
      value: gameByAgeAgg.find(a => a._id === label)?.value ?? 0,
    }));
    const couponDiscountBreakdown = couponDiscountAgg.map(c => ({
      name: `${c._id}%`,
      value: c.count,
    }));
    const hourlyMap = Object.fromEntries(hourlyAgg.map(h => [h._id, h.count]));
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: hourlyMap[hour] ?? 0 }));
    const peakHour = peakHours.reduce((max, h) => (h.count > max.count ? h : max), peakHours[0]);
    const frequentVisitorMap = Object.fromEntries(frequentVisitorAgg.map(f => [f._id, f.value]));
    const visitorBreakdown = [
      { name: 'Normal',   value: frequentVisitorMap.Normal   ?? 0 },
      { name: 'Frequent', value: frequentVisitorMap.Frequent ?? 0 },
    ];
    const gameTypeMap = Object.fromEntries(gameTypeAgg.map(g => [g._id, g.value]));
    const gameTypeBreakdown = [
      { name: 'Spin',        value: gameTypeMap.spin ?? 0 },
      { name: 'Catch Gifts', value: gameTypeMap['catch-gifts'] ?? 0 },
    ];
    const catchGiftsStats = {
      plays:    catchGiftsStatsAgg[0]?.plays ?? 0,
      avgScore: catchGiftsStatsAgg[0]?.avgScore ? Math.round(catchGiftsStatsAgg[0].avgScore * 10) / 10 : 0,
      maxScore: catchGiftsStatsAgg[0]?.maxScore ?? 0,
    };

    res.json({
      success: true,
      data: {
        totalSessions, totalProducts, totalCoupons, totalGames,
        genderDistribution, ageDistribution, dailyActivity,
        gameByGender, gameByAge, couponDiscountBreakdown,
        peakHours, peakHour: peakHour.count > 0 ? peakHour.hour : null,
        visitorBreakdown, gameTypeBreakdown, catchGiftsStats,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/recent — last 20 sessions joined with their coupon (if any)
router.get('/recent', requireAdmin, async (req, res, next) => {
  try {
    const sessions = await Session.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'promocodes',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'couponData',
        },
      },
      {
        $addFields: {
          couponCode:    { $arrayElemAt: ['$couponData.code', 0] },
          hasPlayedGame: { $in: ['$lastState', ['gamification', 'survey', 'complete']] },
          confidence:    { $ifNull: ['$genderConfidence', { $ifNull: ['$ageConfidence', 0] }] },
        },
      },
      { $project: { couponData: 0 } },
    ]);
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
});

export default router;
