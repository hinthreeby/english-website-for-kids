const express = require("express");
const router = express.Router();
const { protect, isParent } = require("../middleware/authMiddleware");
const User = require("../models/User");
const GameResult = require("../models/GameResult");

router.get("/children", protect, isParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate("children", "-password");
    return res.json({ children: parent?.children || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/child/:childId/progress", protect, isParent, async (req, res) => {
  try {
    const child = await User.findById(req.params.childId);
    if (!child || child.parentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your child" });
    }

    const results = await GameResult.find({ userId: req.params.childId })
      .sort({ completedAt: -1 })
      .limit(50);

    return res.json({
      child: {
        username: child.username,
        displayName: child.displayName,
        totalStars: child.totalStars,
        currentStreak: child.currentStreak,
      },
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/create-child", protect, isParent, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const child = await User.create({
      username: username.trim(),
      password,
      displayName: username.trim(),
      role: "child",
      parentId: req.user._id,
      isApproved: true,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { children: child._id },
    });

    return res.status(201).json({ child });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/profile", protect, isParent, async (req, res) => {
  try {
    const { email, displayName } = req.body;
    const update = {};
    if (displayName !== undefined) update.displayName = displayName.trim();
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ error: "Email cannot be empty" });
      const conflict = await User.findOne({ email: trimmed, _id: { $ne: req.user._id } });
      if (conflict) return res.status(400).json({ error: "Email already in use" });
      update.email = trimmed;
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/change-password", protect, isParent, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current and new password are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be at least 6 characters" });
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

module.exports = router;
