/**
 * Downloads all product images from Unsplash → saves to frontend/public/weather-products/
 * Then updates every product in MongoDB to use the local /weather-products/<file>.jpg path.
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

// ── All product images ─────────────────────────────────────────────────────────
const IMAGE_MAP = [
  // Weather products
  { name: 'Ice Cream Cone',         file: 'ice-cream-cone.jpg',        url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=85' },
  { name: 'Chilled Cold Drink',     file: 'cold-drink.jpg',            url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=85' },
  { name: 'Summer Sale — 50% OFF',  file: 'summer-sale.jpg',           url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=85' },
  { name: 'Hot Coffee',             file: 'hot-coffee.jpg',            url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=85' },
  { name: 'Green Tea',              file: 'green-tea.jpg',             url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=85' },
  { name: 'Winter Jacket',          file: 'winter-jacket.jpg',         url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=85' },
  { name: 'Premium Umbrella',       file: 'umbrella.jpg',              url: 'https://images.unsplash.com/photo-1529656087219-7f3c62d5e329?w=600&q=85' },
  { name: 'Waterproof Raincoat',    file: 'raincoat.jpg',              url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=85' },
  { name: 'Special Deals — Today Only!', file: 'special-deals.jpg',   url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=85' },

  // Ice cream products
  { name: 'Strawberry Scoop',       file: 'strawberry-scoop.jpg',      url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=85' },
  { name: 'Chocolate Fudge Cone',   file: 'chocolate-fudge-cone.jpg',  url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=85' },
  { name: 'Vanilla Dream Bowl',     file: 'vanilla-dream-bowl.jpg',    url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=85' },
  { name: 'Pink Unicorn Cone',      file: 'pink-unicorn-cone.jpg',     url: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=600&q=85' },
  { name: 'Mango Sorbet',           file: 'mango-sorbet.jpg',          url: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=85' },
  { name: 'Cookies & Cream Sundae', file: 'cookies-cream-sundae.jpg',  url: 'https://images.unsplash.com/photo-1567206563114-c179906b8f2e?w=600&q=85' },
  { name: 'Pistachio Delight',      file: 'pistachio-delight.jpg',     url: 'https://images.unsplash.com/photo-1514849302-984523450cf4?w=600&q=85' },
  { name: 'Rainbow Popsicle',       file: 'rainbow-popsicle.jpg',      url: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=600&q=85' },
  { name: 'Mint Choco Chip',        file: 'mint-choco-chip.jpg',       url: 'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=600&q=85' },
];

// ── Download helper (follows redirects) ───────────────────────────────────────
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
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => { file.close(); fs.unlink(dest, () => {}); reject(err); });
    };
    get(url);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

async function run() {
  // 1. Make sure the output folder exists
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 2. Download all images
  console.log(`\nDownloading ${IMAGE_MAP.length} images to:\n  ${OUT_DIR}\n`);
  for (const item of IMAGE_MAP) {
    const dest = path.join(OUT_DIR, item.file);
    process.stdout.write(`  Downloading ${item.file.padEnd(30)} ...`);
    try {
      await downloadFile(item.url, dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(` ✅  ${kb} KB`);
    } catch (err) {
      console.log(` ❌  ${err.message}`);
    }
  }

  // 3. Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  // 4. Update each product's imageUrl to local path
  console.log('Updating MongoDB product imageUrls...\n');
  let updated = 0;
  for (const item of IMAGE_MAP) {
    const localPath = `/weather-products/${item.file}`;
    const result = await Product.findOneAndUpdate(
      { name: item.name },
      { $set: { imageUrl: localPath } },
      { new: true }
    );
    if (result) {
      console.log(`  ✅  ${item.name}`);
      console.log(`      ${localPath}`);
      updated++;
    } else {
      console.log(`  ⚠️   Not found in DB: ${item.name}`);
    }
  }

  console.log(`\n✅  Done! ${updated}/${IMAGE_MAP.length} products updated.`);
  console.log('All images are now served locally — no internet needed.\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
