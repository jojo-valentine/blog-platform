import { User, Role, HasRole } from "../models";

async function seedHasRole() {
  try {
    console.log("🌱 Seeding hasRole...");

    // ล้างข้อมูลก่อน
    await HasRole.deleteMany({});
    console.log("🗑️ Cleared HasRole");

    // หา role
    const adminRole = await Role.findOne({ name: "admin" });
    const userRole = await Role.findOne({ name: "user" });

    if (!adminRole || !userRole) {
      throw new Error("❌ Roles not found (run seedRole ก่อน)");
    }

    // ดึง users
    const users = await User.find();

    if (!users.length) {
      throw new Error("❌ Users not found (run seedUser ก่อน)");
    }

    // map ความสัมพันธ์
    const hasRoles = users.map((u) => ({
      role_id: u.email === "alice@example.com" ? adminRole._id : userRole._id,
      user_id: u._id,
      resource: u.email === "alice@example.com" ? "admin" : "user",
    }));

    // insert
    await HasRole.insertMany(hasRoles);

    console.log(`✅ Inserted ${hasRoles.length} HasRole`);
  } catch (error) {
    console.error("❌ Seed hasRole failed:", error);
    throw error;
  }
}

export default seedHasRole;
