const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const Classroom = require("../models/Classroom");
const WordList = require("../models/WordList");
const User = require("../models/User");
const GameResult = require("../models/GameResult");

router.get("/stats", protect, isTeacher, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacherId: req.user._id }).lean();
    const studentIds = [...new Set(classrooms.flatMap((c) => c.students.map((id) => id.toString())))];

    const [students, totalGamesPlayed] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select("totalStars currentStreak").lean(),
      GameResult.countDocuments({ userId: { $in: studentIds } }),
    ]);

    const avgStars =
      students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + (s.totalStars || 0), 0) / students.length)
        : 0;

    return res.json({
      totalClassrooms: classrooms.length,
      totalStudents: studentIds.length,
      avgStarsPerStudent: avgStars,
      totalGamesPlayed,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/classrooms", protect, isTeacher, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacherId: req.user._id }).populate(
      "students",
      "username displayName totalStars currentStreak"
    );
    return res.json({ classrooms });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/classroom", protect, isTeacher, async (req, res) => {
  try {
    const { name } = req.body;
    const classroom = await Classroom.create({ name, teacherId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { classrooms: classroom._id },
    });
    return res.status(201).json({ classroom });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/classroom/:id/students", protect, isTeacher, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id).populate(
      "students",
      "username displayName totalStars currentStreak lastPlayedDate"
    );

    if (!classroom || classroom.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your classroom" });
    }

    return res.json({ students: classroom.students });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/wordlist", protect, isTeacher, async (req, res) => {
  try {
    const { title, words, gameType } = req.body;
    const wordlist = await WordList.create({
      title,
      words,
      gameType,
      teacherId: req.user._id,
      isPublished: false,
      isApproved: false,
    });
    return res.status(201).json({ wordlist });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/wordlists", protect, isTeacher, async (req, res) => {
  try {
    const lists = await WordList.find({ teacherId: req.user._id });
    return res.json({ lists });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", protect, isTeacher, async (req, res) => {
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

router.patch("/change-password", protect, isTeacher, async (req, res) => {
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
