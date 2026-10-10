/**
 * One-off fix for the clothing dataset that was seeded with placeholder
 * price (999 for everyone) and location (floor 1, shop "TBD" for everyone).
 * Assigns each demographic folder a realistic store/floor/shop number and
 * gives every product a realistic, varied price.
 *
 * Usage:
 *   node backend/scripts/fixClothingPricingAndLocation.js
 *
 * Requires backend/.env with MONGODB_URI set. Safe to re-run — it re-rolls
 * prices each time but keeps them within the same realistic bands.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { setServers } from 'dns'
import Product from '../models/Product.js'
import { STORES, randomPrice } from './clothingMallLayout.js'

setServers(['8.8.8.8', '8.8.4.4'])

async function fix() {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI not found — make sure backend/.env is present')
    process.exit(1)
  }

  console.log('⏳  Connecting to MongoDB…')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅  Connected')

  const docs = await Product.find({ imageUrl: /^\/clothing-products\// })
  console.log(`Found ${docs.length} clothing products to update…`)

  let updated = 0
  for (const doc of docs) {
    const folder = doc.imageUrl.split('/')[2]
    const store = STORES[folder]
    if (!store) {
      console.warn(`  ⚠️  No store mapping for folder "${folder}" — skipping ${doc._id}`)
      continue
    }
    doc.storeName = store.storeName
    doc.storeLocation = { floor: store.floor, storeNumber: store.storeNumber }
    doc.price = randomPrice(store.priceMin, store.priceMax)
    await doc.save()
    updated++
  }

  console.log(`\n🎉  Updated ${updated} clothing products with realistic price + floor + shop number.`)
  await mongoose.disconnect()
  console.log('✅  Done.')
}

fix().catch(err => {
  console.error('❌  Fix failed:', err.message)
  process.exit(1)
})
