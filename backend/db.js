import mongoose from 'mongoose';
import { setServers } from 'dns';

// Node.js c-ares can't resolve MongoDB SRV records via the default Windows DNS
// path — force it to use Google's public DNS which handles SRV correctly.
setServers(['8.8.8.8', '8.8.4.4']);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI or MONGO_URI in environment variables');
}

await mongoose.connect(mongoUri);
      console.log('MongoDB connected:', mongoose.connection.host);
      return;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}):`, err.message);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(res => setTimeout(res, RETRY_DELAY_MS));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
}
