const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const { uploadThumbnail, uploadVideo, uploadAvatar } = require("../config/upload");
const User = require("../models/User");

// Multer error → clean JSON response
const handleMulterError = (err, res) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large." });
  }
  return res.status(400).json({ error: err.message || "Upload failed" });
};

// POST /api/upload/thumbnail  — admin only, image files up to 10 MB
router.post("/thumbnail", protect, isAdmin, (req, res) => {
  uploadThumbnail.single("file")(req, res, (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ error: "No file received" });
    res.json({ url: `/uploads/thumbnails/${req.file.filename}` });
  });
});

// POST /api/upload/video  — admin only, video files up to 500 MB
router.post("/video", protect, isAdmin, (req, res) => {
  uploadVideo.single("file")(req, res, (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return res.status(400).json({ error: "No file received" });
    res.json({ url: `/uploads/videos/${req.file.filename}` });
  });
});

// POST /api/upload/avatar — any logged-in user (child, teacher, parent)
// Accepts multipart file upload OR JSON { avatarUrl: "..." }
router.post("/avatar", protect, (req, res) => {
  uploadAvatar.single("file")(req, res, async (err) => {
    if (err) return handleMulterError(err, res);
    try {
      let avatarUrl;
      if (req.file) {
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      } else {
        const urlBody = req.body?.avatarUrl;
        if (!urlBody || !urlBody.trim()) {
          return res.status(400).json({ error: "Provide a file or an avatar URL" });
        }
        avatarUrl = urlBody.trim();
      }
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true }
      ).select("-password");
      return res.json({ user });
    } catch (dbErr) {
      return res.status(500).json({ error: dbErr.message });
    }
  });
});

module.exports = router;
