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
    googleId: {
      type: String,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      default: null,
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
    planetsUnlocked: {
      type: [String],
      default: [],
    },
    allPlanetsBonus: {
      type: Boolean,
      default: false,
    },
    trustedDevices: [
      {
        tokenHash: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
