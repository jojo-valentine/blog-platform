import { User, Blog, ImageCategory } from "../models";
import dotenv from "dotenv";
import connectDB from "../config/db";
async function seedBlog() {
  try {
    console.log("🌱 Seeding blogs...");

    // ล้างข้อมูล
    await Blog.deleteMany({});
    console.log("🗑️ Cleared blogs");

    // ดึง users
    const users = await User.find();

    if (!users.length) {
      throw new Error("❌ users not found (run seedUser ก่อน)");
    }
    const types = await ImageCategory.find();
    // สุ่ม category 1-2 อัน
    const randomTypes = types.sort(() => 0.5 - Math.random()).slice(0, 2);

    // สร้าง blog
    const blogs = users.map((u, index) => ({
      user_id: u._id,
      title: `Blog ${index + 1} by ${u.email}`,
      content: "This is a seeded blog post.",
      tag_id: randomTypes.map((t) => t._id),
      coverImage: [],
      online: false,
      suspended: false,
      images: [],
    }));

    await Blog.insertMany(blogs);

    console.log(`✅ Seeded ${blogs.length} blogs`);
  } catch (error) {
    console.error("❌ Seed blog failed:", error);
    throw error;
  }
}

export default seedBlog;
dotenv.config(); // ✅ โหลด env ก่อน
async function runSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)
    await seedBlog();
    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();