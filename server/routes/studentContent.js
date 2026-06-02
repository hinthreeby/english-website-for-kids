const express = require("express");
const router = express.Router();
const { protect, isChild } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const { submitLimiter } = require("../config/rateLimiters");
const TeacherContent = require("../models/TeacherContent");
const ContentResult = require("../models/ContentResult");
const User = require("../models/User");

// GET /api/student/contents
// Returns published content assigned to any classroom the student is in
router.get("/", protect, isChild, async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("classrooms").lean();
    const classroomIds = student?.classrooms || [];

    if (classroomIds.length === 0) return res.json({ contents: [] });

    const contents = await TeacherContent.find({
      isPublished: true,
      assignedClassrooms: { $in: classroomIds },
    })
      .select("-questions.correctAnswer")
      .lean();

    // Attach whether student already submitted
    const results = await ContentResult.find({
      studentId: req.user._id,
      contentId: { $in: contents.map((c) => c._id) },
    }).lean();

    const submittedMap = {};
    const playCountMap = {};
    for (const r of results) {
      const key = r.contentId.toString();
      playCountMap[key] = (playCountMap[key] || 0) + 1;
      if (!submittedMap[key]) submittedMap[key] = { score: r.score, completedAt: r.completedAt };
    }

    const enriched = contents.map((c) => ({
      ...c,
      submission: submittedMap[c._id.toString()] || null,
      playCount: playCountMap[c._id.toString()] || 0,
    }));

    return res.json({ contents: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/student/contents/:id
router.get("/:id", protect, isChild, validateObjectId("id"), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("classrooms").lean();
    const classroomIds = (student?.classrooms || []).map((id) => id.toString());

    const content = await TeacherContent.findOne({
      _id: req.params.id,
      isPublished: true,
      assignedClassrooms: { $in: classroomIds },
    })
      .select("-questions.correctAnswer")
      .lean();

    if (!content) return res.status(404).json({ error: "Content not found or not available." });

    const results = await ContentResult.find({ contentId: req.params.id, studentId: req.user._id }).lean();
    const submission = results.length > 0 ? results[0] : null;
    const playCount = results.length;
    return res.json({ content, submission, playCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/student/contents/:id/complete  (record a game play)
router.post("/:id/complete", protect, isChild, validateObjectId("id"), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("classrooms").lean();
    const studentClassroomIds = (student?.classrooms || []).map((id) => id.toString());

    const content = await TeacherContent.findOne({
      _id: req.params.id,
      isPublished: true,
      assignedClassrooms: { $in: studentClassroomIds },
    }).lean();

    if (!content) return res.status(404).json({ error: "Content not found or not available." });
    if (content.type !== "game") return res.status(400).json({ error: "Only games use this endpoint." });

    const playCount = await ContentResult.countDocuments({ contentId: req.params.id, studentId: req.user._id });
    if (content.playLimit !== null && content.playLimit !== undefined && playCount >= content.playLimit)
      return res.status(400).json({ error: "Play limit reached." });

    const assignedIds = content.assignedClassrooms.map((id) => id.toString());
    const classroomId = studentClassroomIds.find((id) => assignedIds.includes(id));

    await ContentResult.create({
      contentId: req.params.id,
      studentId: req.user._id,
      classroomId,
      score: 100,
      totalQuestions: 0,
    });

    const newPlayCount = playCount + 1;
    const limitReached = content.playLimit !== null && content.playLimit !== undefined && newPlayCount >= content.playLimit;
    return res.json({ playCount: newPlayCount, limitReached });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/student/contents/:id/submit
router.post("/:id/submit", protect, isChild, validateObjectId("id"), submitLimiter, async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers)) return res.status(400).json({ error: "answers must be an array." });

  try {
    const student = await User.findById(req.user._id).select("classrooms").lean();
    const studentClassroomIds = (student?.classrooms || []).map((id) => id.toString());

    // Fetch full content WITH correctAnswer for grading
    const content = await TeacherContent.findOne({
      _id: req.params.id,
      isPublished: true,
      assignedClassrooms: { $in: studentClassroomIds },
    }).lean();

    if (!content) return res.status(404).json({ error: "Content not found or not available." });
    if (content.type !== "quiz") return res.status(400).json({ error: "Only quizzes can be submitted." });

    const playCount = await ContentResult.countDocuments({ contentId: req.params.id, studentId: req.user._id });
    const limit = content.playLimit ?? 1;
    if (playCount >= limit) return res.status(400).json({ error: "You have reached the attempt limit for this quiz." });

    // Auto-determine classroomId: first intersection of student's classrooms and content's assignedClassrooms
    const assignedIds = content.assignedClassrooms.map((id) => id.toString());
    const classroomId = studentClassroomIds.find((id) => assignedIds.includes(id));

    let correct = 0;
    const graded = content.questions.map((q, i) => {
      const given = answers[i] ?? null;
      const isCorrect = given === q.correctAnswer;
      if (isCorrect) correct++;
      return { questionText: q.questionText, given, correct: q.correctAnswer, isCorrect };
    });

    const score = content.questions.length > 0
      ? Math.round((correct / content.questions.length) * 100)
      : 0;

    await ContentResult.create({
      contentId: req.params.id,
      studentId: req.user._id,
      classroomId,
      score,
      totalQuestions: content.questions.length,
    });

    return res.json({ score, correct, total: content.questions.length, graded });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
