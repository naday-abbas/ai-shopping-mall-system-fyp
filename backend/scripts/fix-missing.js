/**
 * Fixes:
 * 1. Downloads 2 failed images (umbrella + cookies sundae) with working URLs
 * 2. Re-inserts 4 missing Yummy Scoops ice cream products (deleted by weather-seed)
 * 3. Updates DB paths for the fixed images
 */

import mongoose from 'mongoose';
import { setServers } from 'dns';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
setServers(['8.8.8.8', '8.8.4.4']);

const OUT_DIR = path.join(__dirname, '..', '..', 'frontend', 'public', 'weather-products');

// ── Fixed image URLs ──────────────────────────────────────────────────────────
const FIX_IMAGES = [
  { file: 'umbrella.jpg',           url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=85' },
  { file: 'cookies-cream-sundae.jpg', url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=85' },
];

// ── Missing ice cream products ────────────────────────────────────────────────
const MISSING_ICE_CREAMS = [
  {
    name: 'Strawberry Scoop',
    file: 'strawberry-scoop.jpg',
    url:  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=85',
    brand: 'Yummy Scoops',
    description: 'Fresh strawberry ice cream with real fruit chunks. Cool, creamy & refreshing!',
    price: 300,
    targetWeather: 'Hot',
    storeName: 'Yummy Scoops Parlour',
    floor: '1', storeNumber: 'G-12',
  },
  {
    name: 'Chocolate Fudge Cone',
    file: 'chocolate-fudge-cone.jpg',
    url:  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=85',
    brand: 'Yummy Scoops',
    description: 'Rich Belgian chocolate ice cream in a crispy waffle cone. Double fudge drizzle!',
    price: 300,
    targetWeather: 'Hot',
    storeName: 'Yummy Scoops Parlour',
    floor: '1', storeNumber: 'G-12',
  },
  {
    name: 'Vanilla Dream Bowl',
    file: 'vanilla-dream-bowl.jpg',
    url:  'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=85',
    brand: 'Yummy Scoops',
    description: 'Classic creamy vanilla ice cream served in a bowl. Made with pure Madagascar vanilla.',
    price: 300,
    targetWeather: 'Hot',
    storeName: 'Yummy Scoops Parlour',
    floor: '1', storeNumber: 'G-12',
  },
  {
    name: 'Pink Unicorn Cone',
    file: 'pink-unicorn-cone.jpg',
    url:  'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=600&q=85',
    brand: 'Yummy Scoops',
    description: 'Eye-catching pink bubblegum ice cream with rainbow sprinkles. Kids\' favourite!',
    price: 300,
    targetWeather: 'Hot',
    storeName: 'Yummy Scoops Parlour',
    floor: '1', storeNumber: 'G-12',
  },
];

// ── Download helper ───────────────────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, { headers: { 'User-Agent': 'SmartMall/1.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close(); fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
    };
    get(url);
  });
}

// ── Mongoose setup ────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: String, brand: String, description: String, imageUrl: String,
    category: String,
    targetDemographics: [{ age: String, gender: String }],
    targetWeather: String,
    storeName: String,
    storeLocation: { floor: String, storeNumber: String },
    price: Number,
    isActive: { type: Boolean, default: true },
    clickCount: { type: Number, default: 0 },
  },
  { strict: false }
);
const Product = mongoose.model('Product', productSchema);

async function run() {
  // ── Step 1: Download fixed images ──────────────────────────────────────────
  console.log('\n── Downloading fixed images ──────────────────────────────────\n');
  for (const img of [...FIX_IMAGES, ...MISSING_ICE_CREAMS]) {
    const dest = path.join(OUT_DIR, img.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log(`  ✅  Already exists: ${img.file}`);
      continue;
    }
    process.stdout.write(`  Downloading ${img.file.padEnd(32)} ...`);
    try {
      await downloadFile(img.url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(` ✅  ${kb} KB`);
    } catch (err) {
      console.log(` ❌  ${err.message}`);
    }
  }

  // ── Step 2: Connect & fix DB ────────────────────────────────────────────────
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  // Fix umbrella & cookies sundae URLs
  console.log('── Fixing image URLs in DB ───────────────────────────────────\n');
  const fixes = [
    { name: 'Premium Umbrella',       imageUrl: '/weather-products/umbrella.jpg' },
    { name: 'Cookies & Cream Sundae', imageUrl: '/weather-products/cookies-cream-sundae.jpg' },
  ];
  for (const f of fixes) {
    const r = await Product.findOneAndUpdate({ name: f.name }, { $set: { imageUrl: f.imageUrl } }, { new: true });
    console.log(r ? `  ✅  Updated: ${f.name}` : `  ⚠️  Not found: ${f.name}`);
  }

  // Re-insert missing Yummy Scoops products
  console.log('\n── Re-inserting missing ice cream products ───────────────────\n');
  for (const p of MISSING_ICE_CREAMS) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) {
      await Product.findOneAndUpdate({ name: p.name }, { $set: { imageUrl: `/weather-products/${p.file}` } });
      console.log(`  ♻️  Already exists, URL updated: ${p.name}`);
      continue;
    }
    await Product.create({
      name:        p.name,
      brand:       p.brand,
      description: p.description,
      imageUrl:    `/weather-products/${p.file}`,
      category:    'Food',
      targetDemographics: [{ age: 'All', gender: 'All' }],
      targetWeather: p.targetWeather,
      storeName:   p.storeName,
      storeLocation: { floor: p.floor, storeNumber: p.storeNumber },
      price:       p.price,
      isActive:    true,
    });
    console.log(`  ✅  Inserted: ${p.name}`);
  }

  console.log('\n✅  All done! Every product now uses a local image.\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
