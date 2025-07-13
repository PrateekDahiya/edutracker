import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in your .env file");
}

let cached = (global as unknown as { mongoose?: { conn: unknown; promise: unknown } }).mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as unknown as { mongoose?: { conn: unknown; promise: unknown } }).mongoose = cached;
}

// Ensure cached is always defined
if (!cached) {
  throw new Error('Mongoose cache is not initialized');
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }
  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
} 