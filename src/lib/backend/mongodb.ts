// lib/mongodb.ts
import mongoose from "mongoose";

// Step 1: Get MongoDB URI from environment variables (default for build time)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/buildwise";

// Step 3: TypeScript declaration for global caching
declare global {
 
  var _mongoose: { 
    conn: typeof mongoose | null; 
    promise: Promise<typeof mongoose> | null 
  } | undefined;
}

// Step 4: Initialize global cache if not exists
if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null };
}

// Step 5: Export connection function
export async function connectDB() {
  // If already connected, return existing connection
  if (global._mongoose!.conn) {
    return global._mongoose!.conn;
  }

  // If connection is in progress, wait for it
  if (!global._mongoose!.promise) {
    global._mongoose!.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  // Wait for connection to complete and cache it
  global._mongoose!.conn = await global._mongoose!.promise;
  return global._mongoose!.conn;
}