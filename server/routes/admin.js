const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const WordList = require("../models/WordList");
const GameResult = require("../models/GameResult");

router.get("/users", protect, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select("-password")
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);
    return res.json({
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/user/:id", protect, isAdmin, async (req, res) => {
  try {
    const allowed = ["isActive", "role", "isApproved"];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(
      "-password"
    );
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete("/user/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/pending-teachers", protect, isAdmin, async (_req, res) => {
  try {
    const teachers = await User.find({ role: "teacher", isApproved: false }).select("-password");
    return res.json({ teachers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/approve-teacher/:id", protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password");
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/pending-wordlists", protect, isAdmin, async (_req, res) => {
  try {
    const lists = await WordList.find({ isApproved: false }).populate(
      "teacherId",
      "username displayName"
    );
    return res.json({ lists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/approve-wordlist/:id", protect, isAdmin, async (req, res) => {
  try {
    const list = await WordList.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isPublished: true },
      { new: true }
    );
    return res.json({ list });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/reject-wordlist/:id", protect, isAdmin, async (req, res) => {
  try {
    const list = await WordList.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isPublished: false },
      { new: true }
    );
    return res.json({ list });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/profile", protect, isAdmin, async (req, res) => {
  try {
    const { email, displayName } = req.body;
    const update = {};
    if (email !== undefined) update.email = email.trim().toLowerCase();
    if (displayName !== undefined) update.displayName = displayName.trim();

    if (update.email) {
      const conflict = await User.findOne({ email: update.email, _id: { $ne: req.user._id } });
      if (conflict) return res.status(400).json({ error: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/change-password", protect, isAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/stats", protect, isAdmin, async (_req, res) => {
  try {
    const [totalUsers, totalChildren, totalParents, totalTeachers, totalGames, totalStarsGiven] =
      await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "child", isActive: true }),
        User.countDocuments({ role: "parent", isActive: true }),
        User.countDocuments({ role: "teacher", isActive: true }),
        GameResult.countDocuments(),
        GameResult.aggregate([{ $group: { _id: null, total: { $sum: "$starsEarned" } } }]),
      ]);

    return res.json({
      totalUsers,
      totalChildren,
      totalParents,
      totalTeachers,
      totalGames,
      totalStarsGiven: totalStarsGiven[0]?.total ?? 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
