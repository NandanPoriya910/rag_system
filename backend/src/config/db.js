// db.js handles connecting to MongoDB.
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Some networks block the SRV DNS lookup Atlas (mongodb+srv://) needs.
// Only in that case, use Google's public DNS servers.
if (env.mongoUri.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB connected:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
