import mongoose from "mongoose";
import { Role } from "../models/Role";

const seedRoles = [
  {
    name: "admin",
    permissions: ["create_user", "update_user"],
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
