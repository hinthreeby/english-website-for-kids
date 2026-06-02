const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const { adminLog } = require("../middleware/adminLogger");
const { admin: pinoAdmin } = require("../config/loggers");
const User = require("../models/User");
const WordList = require("../models/WordList");
const GameResult = require("../models/GameResult");
const Video = require("../models/Video");
const { validatePassword } = require("../utils/passwordPolicy");
const { validateDisplayName } = require("../utils/sanitize");

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

router.patch("/user/:id", protect, isAdmin, validateObjectId("id"), async (req, res) => {
  try {
    const allowed = ["isActive", "role", "isApproved"];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select(
      "-password"
    );
    adminLog("UPDATE_USER", req.user._id, req.params.id, update);
    pinoAdmin(update.role ? "change_role" : "update_user", {
      adminId:  req.user._id.toString(),
      targetId: req.params.id,
      method:   req.method,
      url:      req.originalUrl || req.url,
      message:  update.role
        ? `Admin changed role of user ${req.params.id} to ${update.role}`
        : `Admin updated user ${req.params.id}`,
    });
    return res.json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete("/user/:id", protect, isAdmin, validateObjectId("id"), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "Admin cannot delete their own account." });
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    adminLog("DELETE_USER", req.user._id, req.params.id);
    pinoAdmin("delete_user", {
      adminId:  req.user._id.toString(),
      targetId: req.params.id,
      method:   req.method,
      url:      req.originalUrl || req.url,
      message:  `Admin disabled user ${req.params.id}`,
    });
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

router.patch("/approve-teacher/:id", protect, isAdmin, validateObjectId("id"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password");
    adminLog("APPROVE_TEACHER", req.user._id, req.params.id);
    pinoAdmin("update_user", {
      adminId:  req.user._id.toString(),
      targetId: req.params.id,
      method:   req.method,
      url:      req.originalUrl || req.url,
      message:  `Admin approved teacher ${req.params.id}`,
    });
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

router.patch("/approve-wordlist/:id", protect, isAdmin, validateObjectId("id"), async (req, res) => {
  try {
    const list = await WordList.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isPublished: true },
      { new: true }
    );
    adminLog("APPROVE_WORDLIST", req.user._id, req.params.id);
    return res.json({ list });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/reject-wordlist/:id", protect, isAdmin, validateObjectId("id"), async (req, res) => {
  try {
    const list = await WordList.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isPublished: false },
      { new: true }
    );
    adminLog("REJECT_WORDLIST", req.user._id, req.params.id);
    return res.json({ list });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.patch("/profile", protect, isAdmin, async (req, res) => {
  try {
    // Allowlist: only email and displayName may be updated
    const { email, displayName } = req.body;

    if (displayName !== undefined && typeof displayName !== "string")
      return res.status(400).json({ error: "Invalid display name" });
    if (email !== undefined && typeof email !== "string")
      return res.status(400).json({ error: "Invalid email" });

    const update = {};
    if (displayName !== undefined) {
      const err = validateDisplayName(displayName);
      if (err) return res.status(400).json({ error: err });
      update.displayName = displayName.trim();
    }
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

router.patch("/change-password", protect, isAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });

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
    const [
      totalUsers, totalChildren, totalParents, totalTeachers,
      totalGames, totalStarsGiven,
      totalVideos, publishedVideos,
      videoViewsAgg, videosByTypeAgg, topViewedVideos, recentVideos,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "child", isActive: true }),
      User.countDocuments({ role: "parent", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      GameResult.countDocuments(),
      GameResult.aggregate([{ $group: { _id: null, total: { $sum: "$starsEarned" } } }]),
      Video.countDocuments(),
      Video.countDocuments({ isPublished: true }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      Video.aggregate([{ $group: { _id: "$type", count: { $sum: 1 }, published: { $sum: { $cond: ["$isPublished", 1, 0] } } } }]),
      Video.find({ isPublished: true }).sort({ views: -1 }).limit(5).select("title type views thumbnailUrl field"),
      Video.find().sort({ createdAt: -1 }).limit(5).select("title type isPublished createdAt thumbnailUrl"),
    ]);

    const videosByType = { "story-series": 0, "quick-video": 0, "song": 0 };
    videosByTypeAgg.forEach((v) => { if (videosByType[v._id] !== undefined) videosByType[v._id] = v.count; });

    return res.json({
      totalUsers,
      totalChildren,
      totalParents,
      totalTeachers,
      totalGames,
      totalStarsGiven: totalStarsGiven[0]?.total ?? 0,
      totalVideos,
      publishedVideos,
      draftVideos: totalVideos - publishedVideos,
      totalVideoViews: videoViewsAgg[0]?.total ?? 0,
      videosByType,
      topViewedVideos,
      recentVideos,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
