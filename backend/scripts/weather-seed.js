import mongoose from 'mongoose';
import { setServers } from 'dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
setServers(['8.8.8.8', '8.8.4.4']);

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    brand:       { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    imageUrl:    { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Clothes', 'Food', 'Accessories', 'Electronics', 'Other'],
    },
    targetDemographics: [
      {
        age:    { type: String, enum: ['Kid','Young','Adult','Senior','All'], default: 'All' },
        gender: { type: String, enum: ['Male','Female','All'], default: 'All' },
      },
    ],
    targetWeather: {
      type: String,
      enum: ['Rain', 'Sunny', 'Cold', 'Hot', 'Windy', 'All'],
      default: 'All',
    },
    targetEventTags: [{ type: String, trim: true }],
    storeName:    { type: String, trim: true, default: '' },
    storeLocation: {
      floor:       { type: String, required: true },
      storeNumber: { type: String, required: true },
    },
    price:      { type: Number, required: true, min: 0 },
    isActive:   { type: Boolean, default: true },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

const weatherProducts = [
  // ── ☀️ HOT WEATHER ──────────────────────────────────────────────────────────
  {
    name:        'Ice Cream Cone',
    brand:       'Yummy Scoops',
    description: 'Beat the heat! Fresh scoops of strawberry, vanilla & chocolate ice cream in a crispy waffle cone.',
    imageUrl:    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=80',
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 450,
  },
  {
    name:        'Chilled Cold Drink',
    brand:       'FreshCool',
    description: 'Refreshing iced beverages — lemonade, mint cooler & tropical fruit punch. Stay cool this summer!',
    imageUrl:    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80',
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'FreshCool Beverages',
    storeLocation: { floor: '1', storeNumber: 'G-14' },
    price: 250,
  },
  {
    name:        'Summer Sale — 50% OFF',
    brand:       'Smart Mall',
    description: 'Exclusive summer deals across all stores! Grab the best offers on clothes, accessories & electronics.',
    imageUrl:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    category:    'Other',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Smart Mall Promotions',
    storeLocation: { floor: '1', storeNumber: 'INFO' },
    price: 0,
  },

  // ── 🥶 COLD WEATHER ─────────────────────────────────────────────────────────
  {
    name:        'Hot Coffee',
    brand:       'BrewMaster',
    description: 'Freshly brewed premium coffee — cappuccino, latte & americano. Warm up with every sip!',
    imageUrl:    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Cold',
    storeName:    'BrewMaster Café',
    storeLocation: { floor: '2', storeNumber: 'B-05' },
    price: 350,
  },
  {
    name:        'Green Tea',
    brand:       'TeaLeaf',
    description: 'Soothing hot green tea brewed with premium loose-leaf. Healthy, warm & calming for cold days.',
    imageUrl:    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80',
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Cold',
    storeName:    'TeaLeaf Lounge',
    storeLocation: { floor: '2', storeNumber: 'B-07' },
    price: 280,
  },
  {
    name:        'Winter Jacket',
    brand:       'WarmWear',
    description: 'Premium quilted winter jacket with water-resistant shell. Multiple sizes & colours available.',
    imageUrl:    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&q=80',
    category:    'Clothes',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Cold',
    storeName:    'WarmWear Outlet',
    storeLocation: { floor: '3', storeNumber: 'C-18' },
    price: 4500,
  },

  // ── 🌧️ RAINY WEATHER ────────────────────────────────────────────────────────
  {
    name:        'Premium Umbrella',
    brand:       'RainShield',
    description: 'Windproof auto-open umbrella with UV-coated colourful canopy. Compact, lightweight & sturdy.',
    imageUrl:    'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=500&q=80',
    category:    'Accessories',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Rain',
    storeName:    'RainShield Store',
    storeLocation: { floor: '1', storeNumber: 'G-22' },
    price: 1200,
  },
  {
    name:        'Waterproof Raincoat',
    brand:       'DryGuard',
    description: '100% waterproof hooded raincoat with sealed seams. Available S to XXL. Stay dry in style!',
    imageUrl:    'https://images.unsplash.com/photo-1520013817300-1f4c1cb245ef?w=500&q=80',
    category:    'Clothes',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Rain',
    storeName:    'DryGuard Fashion',
    storeLocation: { floor: '3', storeNumber: 'C-25' },
    price: 3800,
  },

  // ── ⛅ CLOUDY / GENERAL ──────────────────────────────────────────────────────
  {
    name:        'Special Deals — Today Only!',
    brand:       'Smart Mall',
    description: 'Handpicked daily deals across all floors. Electronics, fashion, food & more — shop & save today!',
    imageUrl:    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80',
    category:    'Other',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'All',
    storeName:    'Smart Mall Promotions',
    storeLocation: { floor: '1', storeNumber: 'INFO' },
    price: 0,
  },
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  const removed = await Product.deleteMany({
    brand: { $in: ['Yummy Scoops', 'FreshCool', 'BrewMaster', 'TeaLeaf', 'WarmWear', 'RainShield', 'DryGuard', 'Smart Mall'] },
  });
  if (removed.deletedCount > 0) console.log(`Removed ${removed.deletedCount} old weather products.\n`);

  const inserted = await Product.insertMany(weatherProducts);
  console.log(`✅  ${inserted.length} weather products updated with REAL images!\n`);
  inserted.forEach(p => console.log(`  [${p.targetWeather.padEnd(4)}]  ${p.name}  —  PKR ${p.price}`));

  console.log('\nDone!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
