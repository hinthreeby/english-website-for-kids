const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Username, email, password, and confirm password are required.",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ username: username.trim() }, { email: normalizedEmail }],
    });
    if (existing) {
      return res.status(409).json({ message: "Username or email already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashed,
    });

    const token = signToken(user._id.toString());
    res.cookie("token", token, buildCookieOptions());

    return res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalStars: user.totalStars,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required." });
    }

    const normalizedIdentifier = identifier.trim();
    const normalizedEmail = normalizedIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ username: normalizedIdentifier }, { email: normalizedEmail }],
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = signToken(user._id.toString());
    res.cookie("token", token, buildCookieOptions());

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalStars: user.totalStars,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login user." });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", buildCookieOptions());
  return res.json({ message: "Logged out." });
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user." });
  }
});

module.exports = router;
