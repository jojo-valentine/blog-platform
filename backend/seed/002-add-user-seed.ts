import bcrypt from "bcrypt";
import { User } from "../models/User";
import dotenv from "dotenv";
import connectDB from "../config/db";
const seedUsers = [
  {
    name: "Alice Admin",
    email: "alice@example.com",
    mobile: "095621332",
    password: "password123",
    verifyAt: new Date(),
  },
  {
    name: "Bob User",
    email: "bob@example.com",
    mobile: "095621333", // ✅ ต้องไม่ซ้ำ
    password: "password123",
    verifyAt: new Date(),
  },
];

async function seedUser() {
  try {
    console.log("🌱 Seeding users...");

    // ล้างข้อมูล
    await User.deleteMany({});
    console.log("🗑️ Cleared users");

    // hash password
    const hashed = await Promise.all(
      seedUsers.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    );

    await User.insertMany(hashed);

    console.log(`✅ Seeded ${hashed.length} users`);
  } catch (err) {
    console.error("❌ Seed user failed:", err);
    throw err; // ให้ index.ts handle
  }
}

export default seedUser;
dotenv.config(); // ✅ โหลด env ก่อน
async function runSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)
    await seedUser();
    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();