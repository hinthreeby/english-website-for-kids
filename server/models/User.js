const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["child", "parent", "teacher", "admin"],
      default: "child",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pin: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
    isApproved: {
      type: Boolean,
      default: false,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastPlayedDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
