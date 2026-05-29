const multer = require("multer");
const path = require("path");
const fs = require("fs");

const mkdirIfNeeded = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../uploads/thumbnails");
    mkdirIfNeeded(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../uploads/videos");
    mkdirIfNeeded(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `video_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const imageFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed (jpg, png, webp, gif)"), false);
  }
  cb(null, true);
};

const videoFilter = (_req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only video files are allowed (mp4, webm, ogg, mov, avi)"), false);
  }
  cb(null, true);
};

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

module.exports = { uploadThumbnail, uploadVideo };
