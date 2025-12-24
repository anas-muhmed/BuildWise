// src/lib/backend/db.ts
import mongoose from "mongoose";

const MONGOURI = process.env.MONGODB_URI || "mongodb://localhost:27017/buildwise";

if (!MONGOURI) {
  throw new Error("MONGODB_URI not set");
}

let cached: { conn: typeof mongoose | null } = { conn: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  await mongoose.connect(MONGOURI, {
    // useNewUrlParser: true, // new mongoose doesn't need these flags
  });
  cached.conn = mongoose;
  return cached.conn;
}
