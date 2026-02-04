import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Role } from "../src/models/User";
import { hashPassword } from "../src/server/services/argon2.service";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio";

async function seedAdminUser() {
  console.log("🌱 Starting admin user seed...\n");

  try {
    // Connect to MongoDB
    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "sureshojha12dev@gmail.com",
    });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists, skipping creation.");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   2FA Enabled: ${existingAdmin.twoFactorEnabled}`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user with hashed password
    console.log("🔐 Hashing password with Argon2...");
    const hashedPassword = await hashPassword("Admin@123");

    console.log("👤 Creating admin user...");
    const admin = new User({
      email: "sureshojha12dev@gmail.com",
      password: hashedPassword,
      name: "System Admin",
      role: Role.SUPER_ADMIN,
      twoFactorEnabled: false,
      loginAttempts: 0,
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!\n");
    console.log("─────────────────────────────────────");
    console.log("   LOGIN CREDENTIALS");
    console.log("─────────────────────────────────────");
    console.log("   Email:    sureshojha12dev@gmail.com");
    console.log("   Password: Admin@123");
    console.log("   Role:     SUPER_ADMIN");
    console.log("─────────────────────────────────────\n");

    // Disconnect
    await mongoose.disconnect();
    console.log("📦 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
}

// Run seed
seedAdminUser();
