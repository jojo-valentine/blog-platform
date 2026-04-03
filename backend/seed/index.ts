import dotenv from "dotenv";
import connectDB from "../config/db";

import seedRole from "./001-add-role-seed";
import seedUser from "./002-add-user-seed";
import seedHasRole from "./003-add-has-role-seed";
import seedProfile from "./004-add-profile-seed";
import seedBlog from "./005-add-blog-seed";
import seedImageBlog from "./006-add-blog-image-seed";

dotenv.config(); // ✅ โหลด env ก่อน

async function runAllSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)

    await seedRole();
    await seedUser();
    await seedHasRole();
    await seedProfile();
    await seedBlog();
    await seedImageBlog();

    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runAllSeeds();
