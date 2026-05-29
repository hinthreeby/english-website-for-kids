const express = require("express");
const router = express.Router();
const Video = require("../models/Video");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

router.use(protect, isAdmin);

// GET /api/admin/videos
router.get("/", async (req, res) => {
  try {
    const { type, field, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (field) filter.field = field;

    const skip = (Number(page) - 1) * Number(limit);
    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("createdBy", "displayName username")
        .sort({ type: 1, field: 1, episodeNumber: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Video.countDocuments(filter),
    ]);

    res.json({ videos, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/videos
router.post("/", async (req, res) => {
  try {
    const { title, description, type, videoUrl, thumbnailUrl, field, characterName, episodeNumber, unit, isPublished } = req.body;

    const video = await Video.create({
      title,
      description,
      type,
      videoUrl,
      thumbnailUrl,
      field: field || "",
      characterName: characterName || "",
      episodeNumber: type === "story-series" ? (Number(episodeNumber) || 1) : null,
      unit: Number(unit) || 1,
      isPublished: isPublished ?? false,
      createdBy: req.user._id,
    });

    res.status(201).json({ video });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/videos/:id
router.get("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate("createdBy", "displayName username");
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/videos/:id
router.put("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const { title, description, type, videoUrl, thumbnailUrl, field, characterName, episodeNumber, unit, isPublished } = req.body;

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        type,
        videoUrl,
        thumbnailUrl,
        field: field || "",
        characterName: characterName || "",
        episodeNumber: type === "story-series" ? (Number(episodeNumber) || 1) : null,
        unit: Number(unit) || 1,
        isPublished,
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "displayName username");

    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ video });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/videos/:id
router.delete("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/videos/:id/publish — toggle publish
router.patch("/:id/publish", validateObjectId("id"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    video.isPublished = !video.isPublished;
    await video.save();
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
