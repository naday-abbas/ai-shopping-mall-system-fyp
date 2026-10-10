/**
 * Upserts all weather-specific products into MongoDB using the locally-stored
 * images already present in frontend/public/weather-products/.
 *
 * Safe to run multiple times — uses updateOne + upsert so no duplicates are created
 * and no other products are touched.
 *
 * Usage:
 *   cd server
 *   node scripts/seed-weather-images.js
 */

import mongoose from 'mongoose';
import { setServers } from 'dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
setServers(['8.8.8.8', '8.8.4.4']);

import Product from '../models/Product.js';

// All image paths reference files already present in frontend/public/weather-products/
const img = (file) => `/weather-products/${file}`;

const WEATHER_PRODUCTS = [

  // ── HOT WEATHER ──────────────────────────────────────────────────────────────

  {
    name:        'Ice Cream Cone',
    brand:       'Yummy Scoops',
    description: 'Beat the heat! Fresh scoops of strawberry, vanilla & chocolate ice cream in a crispy waffle cone.',
    imageUrl:    img('ice-cream-cone.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 450,
  },
  {
    name:        'Strawberry Scoop',
    brand:       'Yummy Scoops',
    description: 'Fresh strawberry ice cream with real fruit chunks. Cool, creamy & refreshing — perfect for summer!',
    imageUrl:    img('strawberry-scoop.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 300,
  },
  {
    name:        'Chocolate Fudge Cone',
    brand:       'Yummy Scoops',
    description: 'Rich Belgian chocolate ice cream in a crispy waffle cone. Double chocolate fudge drizzle on top!',
    imageUrl:    img('chocolate-fudge-cone.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 300,
  },
  {
    name:        'Vanilla Dream Bowl',
    brand:       'Yummy Scoops',
    description: 'Classic creamy vanilla ice cream served in a bowl. Made with pure Madagascar vanilla — timeless & delicious.',
    imageUrl:    img('vanilla-dream-bowl.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 300,
  },
  {
    name:        'Pink Unicorn Cone',
    brand:       'Yummy Scoops',
    description: 'Eye-catching pink bubblegum ice cream with rainbow sprinkles. Kids\' absolute favourite!',
    imageUrl:    img('pink-unicorn-cone.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'Kid', gender: 'All' }, { age: 'Young', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Yummy Scoops Parlour',
    storeLocation: { floor: '1', storeNumber: 'G-12' },
    price: 300,
  },
  {
    name:        'Mango Sorbet',
    brand:       'FrozenFresh',
    description: 'Tropical Alphonso mango sorbet — 100% real fruit, no artificial colours. Refreshingly fruity!',
    imageUrl:    img('mango-sorbet.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'FrozenFresh Counter',
    storeLocation: { floor: '1', storeNumber: 'G-15' },
    price: 300,
  },
  {
    name:        'Cookies & Cream Sundae',
    brand:       'FrozenFresh',
    description: 'Vanilla ice cream loaded with Oreo cookie crumbles, hot fudge & whipped cream. Pure indulgence!',
    imageUrl:    img('cookies-cream-sundae.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'FrozenFresh Counter',
    storeLocation: { floor: '1', storeNumber: 'G-15' },
    price: 300,
  },
  {
    name:        'Pistachio Delight',
    brand:       'IceLand',
    description: 'Premium pistachio ice cream made with roasted Iranian pistachios. Rich, nutty & luxurious.',
    imageUrl:    img('pistachio-delight.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'Adult', gender: 'All' }, { age: 'Senior', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'IceLand Premium',
    storeLocation: { floor: '2', storeNumber: 'A-08' },
    price: 300,
  },
  {
    name:        'Rainbow Popsicle',
    brand:       'IceLand',
    description: 'Colourful fruit popsicle with layers of strawberry, orange & lemon. Fun for the whole family!',
    imageUrl:    img('rainbow-popsicle.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'IceLand Premium',
    storeLocation: { floor: '2', storeNumber: 'A-08' },
    price: 300,
  },
  {
    name:        'Mint Choco Chip',
    brand:       'IceLand',
    description: 'Cool mint ice cream packed with dark chocolate chips. The ultimate refreshing summer treat!',
    imageUrl:    img('mint-choco-chip.jpg'),
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'IceLand Premium',
    storeLocation: { floor: '2', storeNumber: 'A-08' },
    price: 300,
  },
  {
    name:        'Chilled Cold Drink',
    brand:       'FreshCool',
    description: 'Refreshing iced beverages — lemonade, mint cooler & tropical fruit punch. Stay cool this summer!',
    imageUrl:    img('cold-drink.jpg'),
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
    imageUrl:    img('summer-sale.jpg'),
    category:    'Other',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'Smart Mall Promotions',
    storeLocation: { floor: '1', storeNumber: 'INFO' },
    price: 0,
  },

  // ── COLD WEATHER ─────────────────────────────────────────────────────────────

  {
    name:        'Hot Coffee',
    brand:       'BrewMaster',
    description: 'Freshly brewed premium coffee — cappuccino, latte & americano. Warm up with every sip!',
    imageUrl:    img('hot-coffee.jpg'),
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
    imageUrl:    img('green-tea.jpg'),
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
    imageUrl:    img('winter-jacket.jpg'),
    category:    'Clothes',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Cold',
    storeName:    'WarmWear Outlet',
    storeLocation: { floor: '3', storeNumber: 'C-18' },
    price: 4500,
  },

  // ── RAINY WEATHER ─────────────────────────────────────────────────────────────

  {
    name:        'Premium Umbrella',
    brand:       'RainShield',
    description: 'Windproof auto-open umbrella with UV-coated colourful canopy. Compact, lightweight & sturdy.',
    imageUrl:    img('umbrella.jpg'),
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
    imageUrl:    img('raincoat.jpg'),
    category:    'Clothes',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Rain',
    storeName:    'DryGuard Fashion',
    storeLocation: { floor: '3', storeNumber: 'C-25' },
    price: 3800,
  },

  // ── ALL / GENERAL ─────────────────────────────────────────────────────────────

  {
    name:        'Special Deals — Today Only!',
    brand:       'Smart Mall',
    description: 'Handpicked daily deals across all floors. Electronics, fashion, food & more — shop & save today!',
    imageUrl:    img('special-deals.jpg'),
    category:    'Other',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'All',
    storeName:    'Smart Mall Promotions',
    storeLocation: { floor: '1', storeNumber: 'INFO' },
    price: 0,
  },
];

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI not found — ensure backend/.env is present');
    process.exit(1);
  }

  console.log('⏳  Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected\n');

  let inserted = 0;
  let updated  = 0;

  for (const product of WEATHER_PRODUCTS) {
    const result = await Product.updateOne(
      { name: product.name },
      { $set: product },
      { upsert: true }
    );

    const tag = result.upsertedCount ? 'INSERT' : 'UPDATE';
    if (result.upsertedCount) inserted++;
    else updated++;

    const weather = product.targetWeather.padEnd(4);
    console.log(`  [${weather}] [${tag}]  ${product.name}`);
    console.log(`           imageUrl: ${product.imageUrl}`);
  }

  console.log(`\n✅  Done — ${inserted} inserted, ${updated} updated (${WEATHER_PRODUCTS.length} total)`);
  console.log('   All image URLs now point to local /weather-products/ files.\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌  Fatal:', err.message);
  process.exit(1);
});
