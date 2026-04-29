import mongoose from "mongoose";
import { Role } from "../models/Role";
import dotenv from "dotenv";
import connectDB from "../config/db";
const seedRoles = [
  {
    name: "admin",
    permissions: ["create_user", "update_user", "blog_suspension", "blog_view"],
  },
  {
    name: "bloger",
    permissions: ["create_user"],
  },
];

async function seedRole() {
  try {
    console.log("🌱 Seeding roles...");

    // ล้างข้อมูล
    await Role.deleteMany({});
    console.log("🗑️ Cleared roles");

    // insert
    await Role.insertMany(seedRoles);

    console.log(`✅ Seeded ${seedRoles.length} roles`);
  } catch (error) {
    console.error("❌ Seed role failed:", error);
    throw error; // สำคัญ: ให้ index.ts จัดการ
  }
}

export default seedRole;
dotenv.config(); // ✅ โหลด env ก่อน
async function runSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)
    await seedRole();
    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();
