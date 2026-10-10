import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    rating:            { type: Number, required: true, min: 1, max: 5 },
    satisfied:         { type: Boolean, default: null },
    ageGenderAccurate: { type: Boolean, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
