import User from "../models/userModel.js";
import { envConfig } from "../../config/config.js";
import bcrypt from "bcrypt";

export const seedAdmin = async () => {
  try {
    const adminEmail = envConfig.admin;
    const adminPassword = envConfig.passwordAdmin;

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ Admin email or password not provided in .env, skipping seeding.");
      return;
    }

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log("⚠️ Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      username: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    console.log("✅ Admin seeded successfully.");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};
