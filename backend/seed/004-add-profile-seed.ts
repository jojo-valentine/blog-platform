import { User, Profile } from "../models";
import dotenv from "dotenv";
import connectDB from "../config/db";
async function seedProfile() {
  const nameRandom = [
    "jim",
    "john",
    "jack",
    "alden",
    "rover",
    "laibath",
    "lanter",
    "lee",
    "rezael",
    "vagar",
    "youtber",
    "hana",
    "nao",
  ];

  try {
    console.log("🌱 Seeding profiles...");

    // ล้างข้อมูล
    await Profile.deleteMany({});
    console.log("🗑️ Cleared profiles");

    // ดึง users
    const users = await User.find();

    if (!users.length) {
      throw new Error("❌ users not found (run seedUser ก่อน)");
    }

    const profiles = users.map((u) => {
      const randomName =
        nameRandom[Math.floor(Math.random() * nameRandom.length)];

      return {
        user_id: u._id,
        display_name: u.email === "alice@example.com" ? "alice" : randomName,
        age: null,
        avatar: null,
        social_links: null,
      };
    });

    await Profile.insertMany(profiles);

    console.log(`✅ Seeded ${profiles.length} profiles`);
  } catch (error) {
    console.error("❌ Seed profile failed:", error);
    throw error;
  }
}

export default seedProfile;
dotenv.config(); // ✅ โหลด env ก่อน
async function runSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)
    await seedProfile();
    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();
