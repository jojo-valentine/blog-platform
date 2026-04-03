import { User, Blog } from "../models";

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

    // สร้าง blog
    const blogs = users.map((u, index) => ({
      user_id: u._id,
      title: `Blog ${index + 1} by ${u.email}`,
      content: "This is a seeded blog post.",
      tags: ["seed", "example"],
      coverImage: [],
      online: false,
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