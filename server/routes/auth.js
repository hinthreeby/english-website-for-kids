const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { getDayGap } = require("../services/streakService");

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sendToken = (user, res) => {
  const token = signToken(user._id);
  res.cookie("token", token, buildCookieOptions());
  return token;
};

router.post("/register", async (req, res) => {
  const { username, password, role, email, displayName, confirmPassword } = req.body;
  const requestedRole = role || "parent";
  const allowedRoles = ["parent", "teacher"];

  if (!allowedRoles.includes(requestedRole)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const usernameTrimmed = username.trim();
    const emailTrimmed = email?.trim().toLowerCase();
    const exists = await User.findOne({
      $or: [{ username: usernameTrimmed }, ...(emailTrimmed ? [{ email: emailTrimmed }] : [])],
    });
    if (exists) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const userData = {
      username: usernameTrimmed,
      password,
      role: requestedRole,
      email: emailTrimmed,
      displayName: displayName || "",
      isApproved: requestedRole === "teacher" ? false : true,
    };

    const user = await User.create(userData);

    sendToken(user, res);
    return res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        totalStars: user.totalStars,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password, identifier } = req.body;
  const loginIdentifier = (username || identifier || "").trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const normalizedEmail = loginIdentifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: loginIdentifier }, { email: normalizedEmail }],
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isActive) {
      return res.status(403).json({ error: "Account disabled" });
    }

    if (user.role === "teacher" && !user.isApproved) {
      return res.status(403).json({
        error: "PENDING_APPROVAL",
        message: "Your teacher account is pending admin approval.",
      });
    }

    // For child accounts: reset streak to 0 if they missed a day
    const loginUpdate = { lastLogin: new Date() };
    let streakReset = false;
    if (user.role === "child" && user.lastPlayedDate) {
      const dayGap = getDayGap(user.lastPlayedDate, new Date());
      if (dayGap >= 2) {
        loginUpdate.currentStreak = 0;
        streakReset = true;
      }
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, loginUpdate, { new: true });

    sendToken(user, res);
    return res.json({
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        displayName: updatedUser.displayName,
        totalStars: updatedUser.totalStars,
        currentStreak: updatedUser.currentStreak,
        isApproved: updatedUser.isApproved,
        children: updatedUser.children,
        planetsUnlocked: updatedUser.planetsUnlocked,
      },
      streakReset,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/switch-child", protect, async (req, res) => {
  try {
    const { childId, pin } = req.body;

    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can switch to child profile" });
    }

    const child = await User.findById(childId);
    if (!child || child.parentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your child account" });
    }

    if (child.pin && child.pin !== pin) {
      return res.status(401).json({ error: "Wrong PIN" });
    }

    sendToken(child, res);
    return res.json({
      user: {
        id: child._id,
        username: child.username,
        role: child.role,
        displayName: child.displayName,
        totalStars: child.totalStars,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  return res.json({ user: req.user });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", buildCookieOptions());
  return res.json({ success: true });
});

module.exports = router;
