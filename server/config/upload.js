const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;

// Magic-byte signatures for each accepted image MIME type
const MAGIC_SIGS = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png":  [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/gif":  [Buffer.from("GIF87a"), Buffer.from("GIF89a")],
  // image/webp handled separately (RIFF....WEBP structure)
};

async function checkMagicBytes(filePath, mimetype) {
  let fd;
  try {
    fd = await fsPromises.open(filePath, "r");
    const buf = Buffer.alloc(12);
    await fd.read(buf, 0, 12, 0);
    await fd.close();
    fd = null;

    if (mimetype === "image/webp") {
      return buf.slice(0, 4).equals(Buffer.from("RIFF")) &&
             buf.slice(8, 12).equals(Buffer.from("WEBP"));
    }
    const sigs = MAGIC_SIGS[mimetype];
    if (!sigs) return false;
    return sigs.some((sig) => buf.slice(0, sig.length).equals(sig));
  } catch {
    return false;
  } finally {
    if (fd) await fd.close().catch(() => {});
  }
}

async function deleteUploadedFile(filePath) {
  if (!filePath) return;
  try { await fsPromises.unlink(filePath); } catch {}
}

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

// Explicit whitelist — intentionally excludes image/svg+xml (XSS risk)
const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const imageFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype) || !ALLOWED_IMAGE_EXTS.has(ext)) {
    return cb(new Error("Only jpg, jpeg, png, webp, gif images are allowed."), false);
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

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../uploads/avatars");
    mkdirIfNeeded(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { uploadThumbnail, uploadVideo, uploadAvatar, checkMagicBytes, deleteUploadedFile };
