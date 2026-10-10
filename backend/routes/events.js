import { Router } from 'express';
import Event from '../models/Event.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/events — all events for admin dashboard
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const events = await Event.find().sort({ startDate: -1 });
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
});

// GET /api/events/active — currently running event for kiosk
router.get('/active', async (req, res, next) => {
  try {
    const now = new Date();
    // endDate > now means event hasn't expired yet.
    // startDate check skipped — admin controls visibility via isActive toggle.
    const event = await Event.findOne({
      isActive: true,
      endDate:  { $gt: now },
    }).sort({ startDate: 1 });
    res.json({ success: true, data: event || null });
  } catch (err) { next(err); }
});

// POST /api/events — create new event
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, emoji, description, startDate, endDate, discountPercent, bannerColor, isActive } = req.body;

    const start    = new Date(startDate);
    const end      = new Date(endDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);

    if (end <= start)   return res.status(400).json({ success: false, error: 'End date must be after start date.' });
    if (diffDays > 30)  return res.status(400).json({ success: false, error: 'Event duration cannot exceed 30 days.' });

    const event = await Event.create({
      name, emoji, description, startDate: start, endDate: end,
      discountPercent: Number(discountPercent),
      bannerColor: bannerColor || '#ec4899',
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/toggle — enable / disable event
router.patch('/:id/toggle', requireAdmin, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
    event.isActive = !event.isActive;
    await event.save();
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
