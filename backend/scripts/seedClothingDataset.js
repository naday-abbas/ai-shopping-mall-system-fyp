/**
 * Seeds Product docs from the category-wise "Clothing Data Set" images
 * (copied into frontend/public/clothing-products/<age-gender>/). Each
 * sub-folder name maps directly to a targetDemographics {age, gender} pair.
 * Price, store name, floor etc. are placeholders — edit them from the
 * admin dashboard's Content page after seeding.
 *
 * Usage:
 *   node backend/scripts/seedClothingDataset.js
 *
 * Requires backend/.env with MONGODB_URI set.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import { setServers } from 'dns'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Product from '../models/Product.js'
import { STORES, randomPrice } from './clothingMallLayout.js'

setServers(['8.8.8.8', '8.8.4.4'])

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLOTHING_DIR = join(__dirname, '..', '..', 'frontend', 'public', 'clothing-products')

const FOLDERS = {
  'adult-female':  { age: 'Adult',  gender: 'Female', label: "Women's" },
  'adult-male':    { age: 'Adult',  gender: 'Male',   label: "Men's" },
  'child-female':  { age: 'Kid',    gender: 'Female', label: "Girls'" },
  'child-male':    { age: 'Kid',    gender: 'Male',   label: "Boys'" },
  'senior-female': { age: 'Senior', gender: 'Female', label: "Women's" },
  'senior-male':   { age: 'Senior', gender: 'Male',   label: "Men's" },
  'young-female':  { age: 'Young',  gender: 'Female', label: "Women's" },
  'young-male':    { age: 'Young',  gender: 'Male',   label: "Men's" },
}

// Turns a descriptive filename into a title, or null if it's just a number
// (e.g. "1.jpg", "10.png") — those get a generic name instead.
function titleFromFilename(filename) {
  const base = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '')
  if (/^\d+$/.test(base)) return null
  const cleaned = base
    .replace(/^\d+_/, '')                // strip leading "01_"
    .replace(/_batch_\d+$/i, '')         // strip trailing "_batch_5"
    .replace(/[_-]+/g, ' ')
    .trim()
  return cleaned.replace(/\b\w/g, c => c.toUpperCase())
}

const PRODUCTS = []

for (const [folder, { age, gender, label }] of Object.entries(FOLDERS)) {
  const dir = join(CLOTHING_DIR, folder)
  if (!fs.existsSync(dir)) continue

  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort()

  const store = STORES[folder]

  files.forEach((file, i) => {
    const descriptiveTitle = titleFromFilename(file)
    const name = descriptiveTitle ? `${label} ${descriptiveTitle}` : `${label} Outfit ${i + 1}`

    PRODUCTS.push({
      name,
      brand: '',
      description: 'Placeholder description — edit from the admin dashboard.',
      imageUrl: `/clothing-products/${folder}/${file}`,
      category: 'Clothes',
      targetDemographics: [{ age, gender }],
      targetWeather: 'All',
      storeName: store.storeName,
      storeLocation: { floor: store.floor, storeNumber: store.storeNumber },
      price: randomPrice(store.priceMin, store.priceMax),
      isActive: true,
    })
  })
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI not found — make sure backend/.env is present')
    process.exit(1)
  }

  console.log('⏳  Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅  Connected')

  const docs = await Product.insertMany(PRODUCTS)
  console.log(`\n🎉  Inserted ${docs.length} clothing products:\n`)
  docs.forEach((d, i) => console.log(`  ${String(i + 1).padStart(2, '0')}. [${d.targetDemographics[0].age}/${d.targetDemographics[0].gender}] ${d.name}`))

  await mongoose.disconnect()
  console.log('\n✅  Done. Edit these from the admin dashboard Content page.')
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
