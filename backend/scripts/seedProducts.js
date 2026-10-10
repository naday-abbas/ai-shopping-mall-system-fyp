/**
 * Product seed script — inserts 24 diverse products covering Kids, Teens,
 * Adults, and Seniors across Clothes, Accessories, and Footwear categories.
 *
 * Usage:
 *   node backend/scripts/seedProducts.js
 *
 * Requires backend/.env with MONGODB_URI set.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import Product from '../models/Product.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const img = (id, params = 'w=600&h=600&fit=crop&q=80') =>
  `https://images.unsplash.com/photo-${id}?${params}`

// ─── Product data ─────────────────────────────────────────────────────────────

const PRODUCTS = [

  // ── KIDS ──────────────────────────────────────────────────────────────────

  {
    name: 'Boys Graphic T-Shirt',
    brand: 'KidZone',
    description: 'Fun dinosaur print cotton tee — soft, breathable, easy to wash. Perfect for active play days.',
    imageUrl: img('1519238263530-99bdd11df2ea'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Kid', gender: 'Male' }],
    targetWeather: 'Sunny',
    storeName: 'KidZone Kids Wear',
    storeLocation: { floor: '1', storeNumber: 'A-04' },
    price: 799,
  },
  {
    name: 'Girls Floral Summer Frock',
    brand: 'Pinky',
    description: 'Lightweight chiffon frock with floral print. Knee-length, easy fit, machine washable.',
    imageUrl: img('1518791841217-8d020891455'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Kid', gender: 'Female' }],
    targetWeather: 'Hot',
    storeName: 'Pinky Little Fashion',
    storeLocation: { floor: '1', storeNumber: 'A-06' },
    price: 1299,
  },
  {
    name: 'Kids Unisex Sneakers',
    brand: 'Lil Kicks',
    description: 'Velcro-closure canvas sneakers with cushioned insoles. Slip-resistant sole for active kids.',
    imageUrl: img('1542291026-7eec264c27ff'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Kid', gender: 'All' }],
    targetWeather: 'All',
    storeName: 'Step Up Footwear',
    storeLocation: { floor: '2', storeNumber: 'B-11' },
    price: 1899,
  },
  {
    name: 'Boys Denim Jacket',
    brand: 'DenimLittle',
    description: 'Classic button-up denim jacket with two chest pockets. Slim fit, available in blue wash.',
    imageUrl: img('1503341504253-dff4815485f1'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Kid', gender: 'Male' }],
    targetWeather: 'Cold',
    storeName: 'KidZone Kids Wear',
    storeLocation: { floor: '1', storeNumber: 'A-04' },
    price: 1999,
  },
  {
    name: 'Girls School Backpack',
    brand: 'Carry On',
    description: 'Colourful padded backpack with ergonomic straps and a front pocket for stationery.',
    imageUrl: img('1553062407-98eeb64c6a62'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Kid', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Carry On Bags & More',
    storeLocation: { floor: '2', storeNumber: 'B-08' },
    price: 1499,
  },
  {
    name: 'Kids Hair Clip Set (12 pcs)',
    brand: 'Twinkle',
    description: 'Assorted pastel bow and pearl clips. Gentle on hair, suitable for ages 3–10.',
    imageUrl: img('1591369822096-ffd140ec948b'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Kid', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Twinkle Accessories',
    storeLocation: { floor: '1', storeNumber: 'A-12' },
    price: 399,
  },

  // ── TEENS / YOUNG ─────────────────────────────────────────────────────────

  {
    name: 'Oversized Fleece Hoodie',
    brand: 'UrbanPulse',
    description: 'Drop-shoulder hoodie in heavyweight 320gsm fleece. Kangaroo pocket, rib-knit cuffs.',
    imageUrl: img('1559056194-d73f42204d8b'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Young', gender: 'All' }],
    targetWeather: 'Cold',
    storeName: 'UrbanPulse Street Wear',
    storeLocation: { floor: '3', storeNumber: 'C-02' },
    price: 2499,
  },
  {
    name: 'Slim-Fit Cargo Joggers',
    brand: 'StreetFlex',
    description: 'Tapered leg, elasticated waist with drawstring. Six cargo pockets, cotton-spandex blend.',
    imageUrl: img('1596755389378-c31d21fd1273'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Young', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'UrbanPulse Street Wear',
    storeLocation: { floor: '3', storeNumber: 'C-02' },
    price: 1799,
  },
  {
    name: 'High-Top Running Trainers',
    brand: 'ZoomX',
    description: 'Lightweight mesh upper with foam-padded ankle collar. Rubber outsole with grip pattern.',
    imageUrl: img('1525507119028-ed4c629a60a3'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Young', gender: 'All' }],
    targetWeather: 'All',
    storeName: 'Step Up Footwear',
    storeLocation: { floor: '2', storeNumber: 'B-11' },
    price: 4999,
  },
  {
    name: 'Mini Crossbody Sling Bag',
    brand: 'PackIt',
    description: 'Faux-leather crossbody with adjustable strap and zip closure. Fits phone, cards, keys.',
    imageUrl: img('1539533018447-63fcce2678e3'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Young', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Carry On Bags & More',
    storeLocation: { floor: '2', storeNumber: 'B-08' },
    price: 1999,
  },
  {
    name: 'Graphic Statement Tee',
    brand: 'UrbanPulse',
    description: 'Boxy-fit 100% cotton tee with bold screen-printed slogan. Pre-washed for softness.',
    imageUrl: img('1521572163474-6864f9cf17ab'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Young', gender: 'All' }],
    targetWeather: 'Sunny',
    storeName: 'UrbanPulse Street Wear',
    storeLocation: { floor: '3', storeNumber: 'C-02' },
    price: 1299,
  },
  {
    name: 'Teen Stud Earring Set (6 pairs)',
    brand: 'GlimmerCo',
    description: 'Hypoallergenic stainless steel studs — stars, hoops, pearls. Gift-ready packaging.',
    imageUrl: img('1608231387042-66d1773d3028'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Young', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Twinkle Accessories',
    storeLocation: { floor: '1', storeNumber: 'A-12' },
    price: 599,
  },

  // ── ADULTS ────────────────────────────────────────────────────────────────

  {
    name: "Men's Slim Oxford Shirt",
    brand: 'BriefCase',
    description: 'Two-ply 100% Egyptian cotton. Semi-spread collar, single chest pocket, machine washable.',
    imageUrl: img('1602810318383-e386cc2a3ccf'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Adult', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'BriefCase Menswear',
    storeLocation: { floor: '3', storeNumber: 'C-07' },
    price: 2999,
  },
  {
    name: "Women's Boho Maxi Dress",
    brand: 'LunaWear',
    description: 'Flowy rayon maxi dress with paisley print, smocked waist, and flutter sleeves.',
    imageUrl: img('1515886657613-9f3515b0c78f'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Adult', gender: 'Female' }],
    targetWeather: 'Hot',
    storeName: 'LunaWear Women\'s Fashion',
    storeLocation: { floor: '3', storeNumber: 'C-15' },
    price: 4499,
  },
  {
    name: "Men's Bi-Fold Leather Wallet",
    brand: 'VaultCraft',
    description: 'Full-grain cowhide leather, 8 card slots, RFID-blocking lining. Slim profile.',
    imageUrl: img('1585386959984-a4155224a1ad'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Adult', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'VaultCraft Leather Goods',
    storeLocation: { floor: '2', storeNumber: 'B-03' },
    price: 1999,
  },
  {
    name: "Women's Tote Handbag",
    brand: 'MaisonBag',
    description: 'Structured vegan leather tote with suede lining, two interior zip pockets, magnetic snap.',
    imageUrl: img('1553062407-98eeb64c6a62'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Adult', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Carry On Bags & More',
    storeLocation: { floor: '2', storeNumber: 'B-08' },
    price: 6999,
  },
  {
    name: "Men's Brogue Oxford Shoes",
    brand: 'HeelCraft',
    description: 'Genuine leather upper with wingtip brogue detailing. Leather-lined, rubber-heel outsole.',
    imageUrl: img('1491553895911-0055eca6402d'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Adult', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'Step Up Footwear',
    storeLocation: { floor: '2', storeNumber: 'B-11' },
    price: 7499,
  },
  {
    name: "Women's Analogue Wrist Watch",
    brand: 'ChronoLux',
    description: 'Rose gold stainless steel case, Japanese quartz movement, genuine leather strap.',
    imageUrl: img('1523275335684-37898b6baf30'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Adult', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'ChronoLux Watches',
    storeLocation: { floor: '1', storeNumber: 'A-18' },
    price: 8999,
  },

  // ── SENIORS ───────────────────────────────────────────────────────────────

  {
    name: "Men's Embroidered Kurta Shalwar",
    brand: 'Chiffon & Co.',
    description: 'Soft lawn fabric with delicate thread embroidery on collar. Relaxed fit, ideal for formal occasions.',
    imageUrl: img('1583743814966-8d68b03ddd91'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Senior', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'Classic Ethnic Wear',
    storeLocation: { floor: '1', storeNumber: 'A-21' },
    price: 3499,
  },
  {
    name: "Women's Premium Lawn Printed Suit",
    brand: 'Sapphire+',
    description: '3-piece lawn suit with digital print dupatta and trouser. Unstitched, ready to customise.',
    imageUrl: img('1512436991641-6745cae09e5'),
    category: 'Clothes',
    targetDemographics: [{ age: 'Senior', gender: 'Female' }],
    targetWeather: 'Hot',
    storeName: 'Classic Ethnic Wear',
    storeLocation: { floor: '1', storeNumber: 'A-21' },
    price: 2999,
  },
  {
    name: "Men's Leather Slip-On Loafers",
    brand: 'ComfortStep',
    description: 'Penny loafer in genuine nappa leather with memory-foam insole. Wide-fit available.',
    imageUrl: img('1549298916-b41d501d3772'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Senior', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'Step Up Footwear',
    storeLocation: { floor: '2', storeNumber: 'B-11' },
    price: 4999,
  },
  {
    name: "Women's Orthopedic Comfort Flats",
    brand: 'EasyWalk',
    description: 'Wide-toe box with arch-support insole. Soft leather upper, non-slip rubber sole.',
    imageUrl: img('1460353581641-37baddab0fa2'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Senior', gender: 'Female' }],
    targetWeather: 'All',
    storeName: 'Step Up Footwear',
    storeLocation: { floor: '2', storeNumber: 'B-11' },
    price: 2499,
  },
  {
    name: "Men's Reading Glasses (+2.0)",
    brand: 'ClearVision',
    description: 'Lightweight titanium frame reading glasses with anti-glare coating. Case included.',
    imageUrl: img('1608231387042-66d1773d3028'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Senior', gender: 'Male' }],
    targetWeather: 'All',
    storeName: 'ClearVision Opticals',
    storeLocation: { floor: '1', storeNumber: 'A-09' },
    price: 1499,
  },
  {
    name: "Women's Pashmina Silk Shawl",
    brand: 'KashmirLoom',
    description: 'Hand-woven 70% pashmina / 30% silk blend shawl. Intricate paisley border, gift-boxed.',
    imageUrl: img('1496747611176-887de152ab89'),
    category: 'Accessories',
    targetDemographics: [{ age: 'Senior', gender: 'Female' }],
    targetWeather: 'Cold',
    storeName: 'Classic Ethnic Wear',
    storeLocation: { floor: '1', storeNumber: 'A-21' },
    price: 3999,
  },
]

// ─── Seed runner ─────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI not found — make sure backend/.env is present')
    process.exit(1)
  }

  console.log('⏳  Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅  Connected')

  const existing = await Product.countDocuments()
  if (existing > 0) {
    console.log(`⚠️   Found ${existing} existing product(s).`)
    console.log('     To avoid duplicates, wipe first? (auto-proceeding with insert-only)')
    // Uncomment the line below to clear existing products before seeding:
    // await Product.deleteMany({})
    // console.log('🗑️   Cleared existing products')
  }

  const docs = await Product.insertMany(PRODUCTS)
  console.log(`\n🎉  Inserted ${docs.length} products:\n`)
  docs.forEach((d, i) => console.log(`  ${String(i + 1).padStart(2, '0')}. [${d.category}] ${d.name} — PKR ${d.price.toLocaleString()}`))

  await mongoose.disconnect()
  console.log('\n✅  Done. Disconnected from MongoDB.')
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
