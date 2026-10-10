/**
 * Shared "mall layout" for the clothing dataset — maps each demographic
 * folder to a realistic store name, floor and shop number, and gives each
 * folder a realistic price band. Used by seedClothingDataset.js (new seeds)
 * and fixClothingPricingAndLocation.js (one-off fix for already-inserted
 * placeholder data).
 */

export const STORES = {
  'adult-female':  { storeName: "Élan Women's Wear",   floor: '1', storeNumber: '2',  priceMin: 2500, priceMax: 22000 },
  'adult-male':    { storeName: "Men's Avenue",         floor: '1', storeNumber: '5',  priceMin: 2500, priceMax: 20000 },
  'young-female':  { storeName: 'Chic Trends',          floor: '1', storeNumber: '8',  priceMin: 1500, priceMax: 9500 },
  'young-male':    { storeName: 'Urban Threads',        floor: '2', storeNumber: '1',  priceMin: 1500, priceMax: 9000 },
  'child-female':  { storeName: 'Little Blossoms',      floor: '2', storeNumber: '4',  priceMin: 800,  priceMax: 4500 },
  'child-male':    { storeName: 'Kids Zone',            floor: '2', storeNumber: '6',  priceMin: 800,  priceMax: 4200 },
  'senior-female': { storeName: 'Grace Comfort Wear',   floor: '2', storeNumber: '9',  priceMin: 2000, priceMax: 15000 },
  'senior-male':   { storeName: 'Classic Gents',        floor: '1', storeNumber: '10', priceMin: 2000, priceMax: 15000 },
}

// Random integer price within [min, max], rounded to the nearest 50 (looks
// like a real price tag instead of an obviously-random number).
export function randomPrice(min, max) {
  const raw = min + Math.random() * (max - min)
  return Math.round(raw / 50) * 50
}
