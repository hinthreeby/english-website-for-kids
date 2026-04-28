const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const Classroom = require("../models/Classroom");
const WordList = require("../models/WordList");
const User = require("../models/User");

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

module.exports = router;
