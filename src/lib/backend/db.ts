// src/lib/backend/db.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/buildwise";

let cached: { conn: typeof mongoose | null } = { conn: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  await mongoose.connect(MONGODB_URI, {
    // useNewUrlParser: true, // new mongoose doesn't need these flags
  });
  cached.conn = mongoose;
  return cached.conn;
}
