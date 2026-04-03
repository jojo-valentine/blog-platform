import mongoose from "mongoose";
import { Blog, ImageBlog } from "../models";
import { IImageBlog } from "../types";
async function seedImageBlog() {
  try {
    console.log("🌱 Seeding image blogs...");

    // ล้างข้อมูล
    await ImageBlog.deleteMany({});
    console.log("🗑️ Cleared image blogs");

    // ดึง blogs
    const blogs = await Blog.find();

    if (!blogs.length) {
      throw new Error("❌ blogs not found (run seedBlog ก่อน)");
    }

    const images: any[] = [];

    blogs.forEach((b, blogIndex) => {
      for (let i = 0; i < 3; i++) {
        images.push({
          blog_id: b._id,
          path: `/uploads/blog/${b._id}/`,
          image: `image-${i}.jpg`,
          caption: `Image ${i} for blog ${blogIndex + 1}`,
          alt: `Blog ${blogIndex + 1} image ${i}`,
          uploadedBy: b.user_id,
        });
      }
    });

    // ✅ insert ถูกตัว
    await ImageBlog.insertMany(images);

    console.log(`✅ Seeded ${images.length} images`);
  } catch (error) {
    console.error("❌ Seed image blog failed:", error);
    throw error;
  }
}

export default seedImageBlog;
