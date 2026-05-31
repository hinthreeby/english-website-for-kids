const express = require("express");
const router = express.Router();
const { activity } = require("../config/loggers");
const Video = require("../models/Video");
const VideoView = require("../models/VideoView");
const validateObjectId = require("../middleware/validateObjectId");
const { viewLimiter } = require("../config/rateLimiters");

// GET /api/videos?type=story-series|quick-video|song&field=...
router.get("/", async (req, res) => {
  try {
    const { type, field } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;
    if (field) filter.field = field;

    const videos = await Video.find(filter)
      .select("-createdBy")
      .sort({ field: 1, episodeNumber: 1, createdAt: 1 });

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos/:id
router.get("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, isPublished: true }).select("-createdBy");
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/videos/:id/view — increment views (no auth required)
router.post("/:id/view", validateObjectId("id"), viewLimiter, async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Fire-and-forget — record the view event without blocking the response
    VideoView.create({ videoId: video._id }).catch(() => {});

    activity("video_watched", {
      videoId: video._id.toString(),
      message: `Video viewed: ${video.title || video._id}`,
    });

    res.json({ views: video.views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
