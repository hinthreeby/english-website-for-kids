const express = require("express");
const router = express.Router();
const { protect, isParent } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const User = require("../models/User");
const GameResult = require("../models/GameResult");
const Classroom = require("../models/Classroom");
const UserInventory = require("../models/UserInventory");
const ContentResult = require("../models/ContentResult");
const RoadmapProgress = require("../models/RoadmapProgress");
const { validatePassword } = require("../utils/passwordPolicy");

router.get("/children", protect, isParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate("children", "-password");
    return res.json({ children: parent?.children || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/child/:childId/progress", protect, isParent, validateObjectId("childId"), async (req, res) => {
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

router.delete("/child/:childId", protect, isParent, validateObjectId("childId"), async (req, res) => {
  try {
    const child = await User.findById(req.params.childId);
    if (!child || child.role !== "child" || child.parentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "That child does not belong to your account." });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $pull: { children: child._id } }),
      Classroom.updateMany({ students: child._id }, { $pull: { students: child._id } }),
      GameResult.deleteMany({ userId: child._id }),
      UserInventory.deleteOne({ userId: child._id }),
      ContentResult.deleteMany({ studentId: child._id }),
      RoadmapProgress.deleteMany({ userId: child._id }),
      User.findByIdAndDelete(child._id),
    ]);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/create-child", protect, isParent, async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username?.trim();
  if (!trimmedUsername || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const existingUser = await User.findOne({ username: trimmedUsername }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({
        code: "USERNAME_TAKEN",
        error: "This child username is already used. Please choose another name.",
      });
    }

    const child = await User.create({
      username: trimmedUsername,
      password,
      displayName: trimmedUsername,
      role: "child",
      parentId: req.user._id,
      isApproved: true,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { children: child._id },
    });

    return res.status(201).json({ child });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.username) {
      return res.status(409).json({
        code: "USERNAME_TAKEN",
        error: "This child username is already used. Please choose another name.",
      });
    }
    return res.status(400).json({ error: err.message });
  }
});

router.post("/join-classroom", protect, isParent, async (req, res) => {
  const { joinCode, childId } = req.body;
  if (!joinCode?.trim() || !childId)
    return res.status(400).json({ error: "Join code and child are required." });

  try {
    const parent = await User.findById(req.user._id);
    const isMyChild = parent.children.some((id) => id.toString() === childId);
    if (!isMyChild)
      return res.status(403).json({ error: "That child does not belong to your account." });

    const classroom = await Classroom.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!classroom)
      return res.status(404).json({ error: "Classroom not found. Check the join code." });
    if (!classroom.isActive)
      return res.status(400).json({ error: "This classroom is no longer active." });

    const alreadyIn = classroom.students.some((id) => id.toString() === childId);
    if (alreadyIn)
      return res.status(400).json({ error: "This child is already in that classroom." });

    await Promise.all([
      Classroom.findByIdAndUpdate(classroom._id, { $push: { students: childId } }),
      User.findByIdAndUpdate(childId, { $push: { classrooms: classroom._id } }),
    ]);

    return res.json({ success: true, classroomName: classroom.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

module.exports = router;
