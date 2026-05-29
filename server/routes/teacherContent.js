const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const TeacherContent = require("../models/TeacherContent");
const ContentResult = require("../models/ContentResult");
const Classroom = require("../models/Classroom");

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "At least one item is required.";
  for (const it of items) {
    if (!it.word?.trim()) return "Each item must have a word.";
  }
  return null;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return "At least one question is required.";
  for (const q of questions) {
    if (!q.questionText?.trim()) return "Each question must have text.";
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4)
      return "Each question must have 2–4 options.";
    if (!q.correctAnswer?.trim()) return "Each question must have a correct answer.";
    if (!q.options.includes(q.correctAnswer))
      return `Correct answer "${q.correctAnswer}" is not in options.`;
  }
  return null;
}

async function ownedClassroomIds(teacherId) {
  const rooms = await Classroom.find({ teacherId }, "_id").lean();
  return rooms.map((r) => r._id.toString());
}

// ── GET /api/teacher/contents ─────────────────────────────────────────────────
router.get("/", protect, isTeacher, async (req, res) => {
  try {
    const contents = await TeacherContent.find({ teacherId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ contents });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/teacher/contents ────────────────────────────────────────────────
router.post("/", protect, isTeacher, async (req, res) => {
  const { title, description, type, template, items, questions } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required." });
  if (!["game", "quiz"].includes(type)) return res.status(400).json({ error: "Invalid type." });
  if (!["match-word-picture", "memory-card", "quiz"].includes(template))
    return res.status(400).json({ error: "Invalid template." });
  if (type === "game" && template === "quiz")
    return res.status(400).json({ error: "Game type cannot use quiz template." });
  if (type === "quiz" && template !== "quiz")
    return res.status(400).json({ error: "Quiz type must use quiz template." });

  if (type === "game") {
    const err = validateItems(items);
    if (err) return res.status(400).json({ error: err });
  } else {
    const err = validateQuestions(questions);
    if (err) return res.status(400).json({ error: err });
  }

  try {
    const content = await TeacherContent.create({
      teacherId: req.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      type,
      template,
      items: type === "game" ? items : [],
      questions: type === "quiz" ? questions : [],
    });
    return res.status(201).json({ content });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── GET /api/teacher/contents/:id ─────────────────────────────────────────────
router.get("/:id", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const content = await TeacherContent.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!content) return res.status(404).json({ error: "Content not found." });
    return res.json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/teacher/contents/:id ─────────────────────────────────────────────
router.put("/:id", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  const { title, description, items, questions } = req.body;
  try {
    const content = await TeacherContent.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!content) return res.status(404).json({ error: "Content not found." });

    if (title !== undefined) content.title = title.trim();
    if (description !== undefined) content.description = description.trim();

    if (content.type === "game" && items !== undefined) {
      const err = validateItems(items);
      if (err) return res.status(400).json({ error: err });
      content.items = items;
    }
    if (content.type === "quiz" && questions !== undefined) {
      const err = validateQuestions(questions);
      if (err) return res.status(400).json({ error: err });
      content.questions = questions;
    }

    await content.save();
    return res.json({ content });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/teacher/contents/:id ──────────────────────────────────────────
router.delete("/:id", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const content = await TeacherContent.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    if (!content) return res.status(404).json({ error: "Content not found." });
    await ContentResult.deleteMany({ contentId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/teacher/contents/:id/duplicate ──────────────────────────────────
router.post("/:id/duplicate", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const original = await TeacherContent.findOne({ _id: req.params.id, teacherId: req.user._id }).lean();
    if (!original) return res.status(404).json({ error: "Content not found." });
    const { _id, createdAt, updatedAt, isPublished, assignedClassrooms, ...rest } = original;
    const copy = await TeacherContent.create({
      ...rest,
      title: `${original.title} (copy)`,
      isPublished: false,
      assignedClassrooms: [],
    });
    return res.status(201).json({ content: copy });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/teacher/contents/:id/publish ───────────────────────────────────
router.patch("/:id/publish", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const content = await TeacherContent.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!content) return res.status(404).json({ error: "Content not found." });
    content.isPublished = !content.isPublished;
    await content.save();
    return res.json({ isPublished: content.isPublished });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/teacher/contents/:id/assign ────────────────────────────────────
router.patch("/:id/assign", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  const { classroomIds } = req.body;
  if (!Array.isArray(classroomIds)) return res.status(400).json({ error: "classroomIds must be an array." });
  try {
    const allowed = await ownedClassroomIds(req.user._id);
    const invalid = classroomIds.filter((id) => !allowed.includes(id.toString()));
    if (invalid.length > 0) return res.status(403).json({ error: "One or more classrooms do not belong to you." });

    const content = await TeacherContent.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { assignedClassrooms: classroomIds },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: "Content not found." });
    return res.json({ assignedClassrooms: content.assignedClassrooms });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/teacher/contents/:id/stats ───────────────────────────────────────
router.get("/:id/stats", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const content = await TeacherContent.findOne({ _id: req.params.id, teacherId: req.user._id }).lean();
    if (!content) return res.status(404).json({ error: "Content not found." });

    const results = await ContentResult.find({ contentId: req.params.id })
      .populate("studentId", "username displayName")
      .lean();

    const total = results.length;
    const avgScore = total > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / total) : 0;

    return res.json({ total, avgScore, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
