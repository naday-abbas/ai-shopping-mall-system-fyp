import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    brand:       { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Clothes', 'Food', 'Accessories', 'Electronics', 'Other'],
    },
    // Each entry: { age: 'Kid'|'Young'|'Adult'|'Senior', gender: 'Male'|'Female'|'All' }
    targetDemographics: [
      {
        age: {
          type: String,
          enum: ['Kid', 'Young', 'Adult', 'Senior', 'All'],
          default: 'All',
        },
        gender: {
          type: String,
          enum: ['Male', 'Female', 'All'],
          default: 'All',
        },
      },
    ],
    targetWeather: {
      type: String,
      enum: ['Rain', 'Sunny', 'Cold', 'Hot', 'Windy', 'All'],
      default: 'All',
    },
    targetEventTags: [{ type: String, trim: true }],
    storeName: { type: String, trim: true, default: '' },
    storeLocation: {
      floor: { type: String, required: true },
      storeNumber: { type: String, required: true },
    },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    // Tracks how many times this product was clicked (for popularity ranking)
    clickCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
