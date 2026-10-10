import mongoose from 'mongoose';
import { setServers } from 'dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
setServers(['8.8.8.8', '8.8.4.4']);

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

const updates = [
  {
    name: 'Premium Umbrella',
    imageUrl: 'https://images.unsplash.com/photo-1529656087219-7f3c62d5e329?w=600&q=80',
  },
  {
    name: 'Waterproof Raincoat',
    imageUrl: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  for (const u of updates) {
    const result = await Product.findOneAndUpdate(
      { name: u.name },
      { $set: { imageUrl: u.imageUrl } },
      { new: true }
    );
    if (result) {
      console.log(`✅  Updated: ${u.name}`);
      console.log(`    Image : ${u.imageUrl}\n`);
    } else {
      console.log(`⚠️  Not found: ${u.name}\n`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err.message); process.exit(1); });
