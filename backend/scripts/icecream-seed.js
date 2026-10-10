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
    targetWeather:   { type: String, enum: ['Rain','Sunny','Cold','Hot','Windy','All'], default: 'All' },
    targetEventTags: [{ type: String, trim: true }],
    storeName:       { type: String, trim: true, default: '' },
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

const iceCreams = [
  {
    name:        'Strawberry Scoop',
    brand:       'Yummy Scoops',
    description: 'Fresh strawberry ice cream with real fruit chunks. Cool, creamy & refreshing — perfect for the summer heat!',
    imageUrl:    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1567206563114-c179906b8f2e?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1514849302-984523450cf4?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=500&q=80',
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
    imageUrl:    'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=500&q=80',
    category:    'Food',
    targetDemographics: [{ age: 'All', gender: 'All' }],
    targetWeather: 'Hot',
    storeName:    'IceLand Premium',
    storeLocation: { floor: '2', storeNumber: 'A-08' },
    price: 300,
  },
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  // Remove old ice cream products to avoid duplicates
  const removed = await Product.deleteMany({
    brand: { $in: ['Yummy Scoops', 'FrozenFresh', 'IceLand'] },
  });
  if (removed.deletedCount > 0) console.log(`Removed ${removed.deletedCount} old ice cream products.\n`);

  const inserted = await Product.insertMany(iceCreams);
  console.log(`✅  ${inserted.length} ice cream products added!\n`);
  inserted.forEach(p => console.log(`  ${p.name}  |  PKR ${p.price}  |  ${p.storeName}`));

  console.log('\nDone!');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
