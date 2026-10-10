import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    // No user photos stored — privacy compliance
    detectedAge: {
      type: String,
      enum: ['Kid', 'Young', 'Adult', 'Senior'],
      required: true,
    },
    detectedGender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    ageConfidence: { type: Number, min: 0, max: 1 },
    genderConfidence: { type: Number, min: 0, max: 1 },
    weatherAtTime: { type: String, default: null },
    weatherCondition: { type: String, default: null },
    productsClicked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    promoCodeGenerated: { type: String, default: null },
    satisfied: { type: Boolean, default: null },
    ageGenderAccurate: { type: Boolean, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    // Tracks which state the user reached before leaving (for drop-off analytics)
    lastState: {
      type: String,
      enum: ['scan', 'recommendations', 'gamification', 'survey', 'complete'],
      default: 'scan',
    },
    // How many visits in a row this customer has chained via their own returning coupon code.
    // No identity is stored — the customer voluntarily re-enters a code they were shown before.
    visitStreak: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
