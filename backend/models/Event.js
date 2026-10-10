import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    emoji:           { type: String, default: '🎉' },
    description:     { type: String, default: '' },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    // Locked to the same reward tiers as the kiosk games, so every discount in the project is consistent
    discountPercent: { type: Number, required: true, enum: [5, 10, 15, 20, 25, 30] },
    bannerColor:     { type: String, default: '#ec4899' },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
