// migrations/init.ts
import mongoose from "mongoose";
import { User } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

async function runMigration() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("✅ Connected to MongoDB");

  // สร้าง index
  await User.collection.createIndex({ username: 1 }, { unique: true });
  console.log("✅ Migration complete: User index created");

  await mongoose.disconnect();
}

runMigration().catch(err => console.error("❌ Migration failed:", err));