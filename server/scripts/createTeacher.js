const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

// Thay đổi các thông tin này trước khi chạy
const USERNAME = process.argv[2] || "teacher1";
const EMAIL = process.argv[3] || "teacher1@funeng.local";
const PASSWORD = process.argv[4] || "Teacher@123456";

async function createTeacher() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/funEnglish";
  await mongoose.connect(uri);

  const existing = await User.findOne({ $or: [{ username: USERNAME }, { email: EMAIL }] });
  if (existing) {
    console.log(`Tài khoản đã tồn tại — username: "${existing.username}", email: "${existing.email}"`);
    await mongoose.disconnect();
    return;
  }

  const teacher = await User.create({
    username: USERNAME,
    email: EMAIL,
    password: PASSWORD,
    displayName: USERNAME,
    role: "teacher",
    isApproved: true,
    isActive: true,
  });

  console.log("Teacher tạo thành công!");
  console.log(`  Username : ${teacher.username}`);
  console.log(`  Email    : ${teacher.email}`);
  console.log(`  Password : ${PASSWORD}`);
  console.log(`  Role     : ${teacher.role}`);

  await mongoose.disconnect();
}

createTeacher().catch((err) => {
  console.error("Lỗi:", err.message);
  process.exit(1);
});
