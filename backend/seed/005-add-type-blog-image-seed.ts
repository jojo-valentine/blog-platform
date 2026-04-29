import mongoose from "mongoose";
import { Blog, Role, ImageCategory, User, HasRole } from "../models";
import { IImageBlog } from "../types";
import dotenv from "dotenv";
import connectDB from "../config/db";
async function seedCategoryImage() {
  try {
    console.log("🌱 Seeding image blogs...");

    // ล้างข้อมูล
    await ImageCategory.deleteMany({});
    console.log("🗑️ Cleared imageCategory blogs");

    const imageTypes: string[] = [
      "portrait", // คน
      "landscape", // วิว
      "street", // ชีวิตประจำวัน/ถนน
      "architecture", // อาคาร
      "product", // สินค้า
      "food", // อาหาร
      "event", // งานอีเวนต์
      "travel", // ท่องเที่ยว
    ];
    // หา role admin
    const adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      throw new Error("❌ adminRole not found");
    }

    // หา user ที่เป็น admin
    const hasRole = await HasRole.findOne({
      role_id: adminRole._id,
    });

    if (!hasRole) {
      throw new Error("❌ hasRole not found");
    }
    const user = await User.findById(hasRole.user_id);
    if (!user) {
      throw new Error("❌ user not found");
    }
    // 🔥 map เป็น array แล้ว insert ทีเดียว
    const categories = imageTypes.map((type) => ({
      name: type,
      uploadedBy: user._id,
    }));

    await ImageCategory.insertMany(categories);

    console.log("✅ Seed image categories success");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

export default seedCategoryImage;
dotenv.config(); // ✅ โหลด env ก่อน
async function runSeeds() {
  try {
    await connectDB(); // ✅ สำคัญที่สุด (ตัวแก้ปัญหา)
    await seedCategoryImage();
    console.log("🌱 All seeds completed successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();
