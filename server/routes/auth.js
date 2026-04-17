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
    const { username, password } = req.body;

    if (!username || !password || password.length < 4) {
      return res.status(400).json({
        message: "Username and password (min 4 chars) are required.",
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    const token = signToken(user._id.toString());
    res.cookie("token", token, buildCookieOptions());

    return res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
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
    const { username, password } = req.body;

    const user = await User.findOne({ username });
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
