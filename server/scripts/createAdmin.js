const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@funeng.local";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_DISPLAY_NAME = "Administrator";

async function createAdmin() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/funEnglish";

  await mongoose.connect(uri);
  console.log("Connected to MongoDB:", uri);

  const existing = await User.findOne({ $or: [{ username: ADMIN_USERNAME }, { role: "admin" }] });
  if (existing) {
    console.log(`Admin already exists — username: "${existing.username}", role: "${existing.role}"`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_DISPLAY_NAME,
    role: "admin",
    isApproved: true,
    isActive: true,
  });

  console.log("Admin created successfully!");
  console.log(`  Username : ${admin.username}`);
  console.log(`  Email    : ${admin.email}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log(`  Role     : ${admin.role}`);

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
