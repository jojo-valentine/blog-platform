import { User, Profile } from "../models";

async function seedProfile() {
  const nameRandom = [
    "jim","john","jack","alden","rover",
    "laibath","lanter","lee","rezael",
    "vagar","youtber","hana","nao",
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
        displayName:
          u.email === "alice@example.com" ? "alice" : randomName,
        bio: null,
        avatar: null,
        socialLinks: null,
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