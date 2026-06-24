const express        = require("express");
const router         = express.Router();
const jwt            = require("jsonwebtoken");
const mongoose       = require("mongoose");
const path           = require("path");

const { protect, requireRole } = require("../middleware/authMiddleware");
const validateObjectId         = require("../middleware/validateObjectId");
const { uploadForumMedia, FORUM_SIZE_LIMITS, deleteUploadedFile } = require("../config/upload");
const env = require("../config/env");

const ForumPost     = require("../models/ForumPost");
const ForumLike     = require("../models/ForumLike");
const ForumSave     = require("../models/ForumSave");
const ForumComment  = require("../models/ForumComment");
const TeacherFollow = require("../models/TeacherFollow");
const TeacherContent = require("../models/TeacherContent");
const User          = require("../models/User");

// ── Optional auth: attaches req.user if a valid JWT cookie is present ─────────
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId  = decoded.id || decoded.userId;
    const user    = await User.findById(userId).select("-password").lean();
    if (user && user.isActive) req.user = user;
  } catch { /* invalid/expired → continue as guest */ }
  return next();
};

const isTeacher = requireRole("teacher", "admin");

// ── Multer error helper ───────────────────────────────────────────────────────
const handleMulterError = (err, res) => {
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "File is too large." });
  return res.status(400).json({ error: err?.message || "Upload failed." });
};

// ── Shared post shape for API responses ──────────────────────────────────────
async function formatPost(doc, userId) {
  const post = doc.toObject ? doc.toObject() : { ...doc };
  // resolve author
  if (post.authorId && typeof post.authorId === "object" && post.authorId.displayName !== undefined) {
    post.author = {
      _id:         post.authorId._id,
      displayName: post.authorId.displayName || post.authorId.username,
      username:    post.authorId.username,
      avatar:      post.authorId.avatar || "",
    };
  }
  // resolve game
  if (post.gameId && typeof post.gameId === "object" && post.gameId.title !== undefined) {
    post.game = { _id: post.gameId._id, title: post.gameId.title, template: post.gameId.template };
  }
  delete post.authorId;
  delete post.gameId;

  if (userId) {
    const [like, save] = await Promise.all([
      ForumLike.exists({ postId: post._id, userId }),
      ForumSave.exists({ postId: post._id, userId }),
    ]);
    post.isLiked = !!like;
    post.isSaved = !!save;
    post._isOwn  = post.author?._id?.toString() === userId.toString();
  } else {
    post.isLiked = false;
    post.isSaved = false;
    post._isOwn  = false;
  }

  return post;
}

// ═════════════════════════════════════════════════════════════════════════════
// POSTS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/forum/posts
router.get("/posts", optionalAuth, async (req, res) => {
  try {
    const { type, tag, q, authorId, page = 1, limit = 20 } = req.query;
    const filter = { visibility: "public" };

    if (type && ["game", "text", "image", "video", "audio"].includes(type)) filter.type = type;
    if (tag)       filter.tags = tag;
    if (authorId && mongoose.isValidObjectId(authorId)) filter.authorId = authorId;
    if (q?.trim()) filter.$or = [
      { title:       { $regex: q.trim(), $options: "i" } },
      { description: { $regex: q.trim(), $options: "i" } },
    ];

    const lim   = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip  = (Math.max(parseInt(page) || 1, 1) - 1) * lim;
    const total = await ForumPost.countDocuments(filter);

    const docs = await ForumPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate("authorId", "displayName username avatar")
      .populate("gameId", "title template")
      .lean();

    // Batch fetch like/save status for current user
    const userId = req.user?._id;
    let likedSet = new Set(), savedSet = new Set();
    if (userId) {
      const ids = docs.map((d) => d._id);
      const [likes, saves] = await Promise.all([
        ForumLike.find({ postId: { $in: ids }, userId }).select("postId").lean(),
        ForumSave.find({ postId: { $in: ids }, userId }).select("postId").lean(),
      ]);
      likedSet = new Set(likes.map((l) => l.postId.toString()));
      savedSet = new Set(saves.map((s) => s.postId.toString()));
    }

    const posts = docs.map((doc) => {
      const author = doc.authorId
        ? { _id: doc.authorId._id, displayName: doc.authorId.displayName || doc.authorId.username, username: doc.authorId.username, avatar: doc.authorId.avatar || "" }
        : null;
      const game = doc.gameId
        ? { _id: doc.gameId._id, title: doc.gameId.title, template: doc.gameId.template }
        : null;
      const id = doc._id.toString();
      return {
        ...doc,
        author,
        game,
        authorId: undefined,
        gameId:   undefined,
        isLiked:  userId ? likedSet.has(id) : false,
        isSaved:  userId ? savedSet.has(id) : false,
        _isOwn:   userId ? (doc.authorId?._id?.toString() === userId.toString()) : false,
      };
    });

    return res.json({ posts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/forum/posts/:id
router.get("/posts/:id", optionalAuth, validateObjectId("id"), async (req, res) => {
  try {
    const doc = await ForumPost.findOne({ _id: req.params.id, visibility: "public" })
      .populate("authorId", "displayName username avatar")
      .populate("gameId", "title template");
    if (!doc) return res.status(404).json({ error: "Post not found." });

    // Increment view count (fire-and-forget)
    ForumPost.updateOne({ _id: doc._id }, { $inc: { viewsCount: 1 } }).exec().catch(() => {});

    const post = await formatPost(doc, req.user?._id);
    return res.json({ post });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/forum/posts  (teacher only, multipart/form-data)
router.post("/posts", protect, isTeacher, (req, res) => {
  uploadForumMedia.single("media")(req, res, async (err) => {
    if (err) return handleMulterError(err, res);

    try {
      const { type, title, description, tags, gameId, visibility } = req.body;

      if (!["game", "text", "image", "video", "audio"].includes(type))
        return res.status(400).json({ error: "Invalid post type." });
      if (!title?.trim())
        return res.status(400).json({ error: "Title is required." });

      // Per-type size check
      if (req.file) {
        const mediaType = req.file.mimetype.startsWith("image/") ? "image"
                        : req.file.mimetype.startsWith("video/") ? "video"
                        : "audio";
        const maxBytes = (FORUM_SIZE_LIMITS[mediaType] || 20) * 1024 * 1024;
        if (req.file.size > maxBytes) {
          await deleteUploadedFile(req.file.path);
          return res.status(413).json({ error: `${mediaType} files must be under ${FORUM_SIZE_LIMITS[mediaType]} MB.` });
        }
      }

      // Validate type-specific required fields
      if (type === "game") {
        if (!gameId || !mongoose.isValidObjectId(gameId))
          return res.status(400).json({ error: "A valid gameId is required for game posts." });
        const game = await TeacherContent.findOne({ _id: gameId, teacherId: req.user._id, isPublished: true });
        if (!game) return res.status(400).json({ error: "Game not found or not published." });
      }
      if (["image", "video", "audio"].includes(type) && !req.file)
        return res.status(400).json({ error: `A ${type} file is required.` });

      // Parse tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
        parsedTags = parsedTags.slice(0, 10).map((t) => String(t).slice(0, 30).toLowerCase());
      }

      // Build mediaUrl relative path for static serving
      let mediaUrl = "";
      if (req.file) {
        const subfolder = req.file.mimetype.startsWith("image/") ? "images"
                        : req.file.mimetype.startsWith("video/") ? "videos"
                        : "audios";
        mediaUrl = `/uploads/forum/${subfolder}/${req.file.filename}`;
      }

      const post = await ForumPost.create({
        authorId:    req.user._id,
        type,
        title:       title.trim(),
        description: description?.trim() || "",
        tags:        parsedTags,
        gameId:      type === "game" ? gameId : null,
        mediaUrl,
        visibility:  ["public", "private"].includes(visibility) ? visibility : "public",
      });

      const populated = await ForumPost.findById(post._id)
        .populate("authorId", "displayName username avatar")
        .populate("gameId", "title template");

      const result = await formatPost(populated, req.user._id);
      return res.status(201).json({ post: result });
    } catch (err) {
      if (req.file) await deleteUploadedFile(req.file.path).catch(() => {});
      return res.status(400).json({ error: err.message });
    }
  });
});

// PUT /api/forum/posts/:id  (own post only)
router.put("/posts/:id", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!post) return res.status(404).json({ error: "Post not found." });

    const { title, description, tags, visibility } = req.body;
    if (title !== undefined)       post.title       = title.trim();
    if (description !== undefined) post.description = description.trim();
    if (visibility !== undefined && ["public", "private"].includes(visibility)) post.visibility = visibility;
    if (tags !== undefined) {
      let parsed = [];
      try { parsed = Array.isArray(tags) ? tags : JSON.parse(tags); } catch { parsed = []; }
      post.tags = parsed.slice(0, 10).map((t) => String(t).slice(0, 30).toLowerCase());
    }

    await post.save();
    const populated = await ForumPost.findById(post._id)
      .populate("authorId", "displayName username avatar")
      .populate("gameId", "title template");
    const result = await formatPost(populated, req.user._id);
    return res.json({ post: result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/forum/posts/:id  (own post only)
router.delete("/posts/:id", protect, isTeacher, validateObjectId("id"), async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!post) return res.status(404).json({ error: "Post not found." });

    // Clean up media file
    if (post.mediaUrl) {
      const abs = path.join(__dirname, "..", post.mediaUrl);
      await deleteUploadedFile(abs).catch(() => {});
    }

    await Promise.all([
      post.deleteOne(),
      ForumLike.deleteMany({ postId: post._id }),
      ForumSave.deleteMany({ postId: post._id }),
      ForumComment.deleteMany({ postId: post._id }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// INTERACTIONS — like / save / share
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/forum/posts/:id/like  (toggle)
router.post("/posts/:id/like", protect, validateObjectId("id"), async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, visibility: "public" });
    if (!post) return res.status(404).json({ error: "Post not found." });

    const existing = await ForumLike.findOne({ postId: post._id, userId: req.user._id });
    let liked;
    if (existing) {
      await existing.deleteOne();
      post.likesCount = Math.max(0, post.likesCount - 1);
      liked = false;
    } else {
      await ForumLike.create({ postId: post._id, userId: req.user._id });
      post.likesCount += 1;
      liked = true;
    }
    await post.save();
    return res.json({ liked, likesCount: post.likesCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/forum/posts/:id/save  (toggle)
router.post("/posts/:id/save", protect, validateObjectId("id"), async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, visibility: "public" });
    if (!post) return res.status(404).json({ error: "Post not found." });

    const existing = await ForumSave.findOne({ postId: post._id, userId: req.user._id });
    let saved;
    if (existing) {
      await existing.deleteOne();
      post.savesCount = Math.max(0, post.savesCount - 1);
      saved = false;
    } else {
      await ForumSave.create({ postId: post._id, userId: req.user._id });
      post.savesCount += 1;
      saved = true;
    }
    await post.save();
    return res.json({ saved, savesCount: post.savesCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/forum/posts/:id/share  (increment counter)
router.post("/posts/:id/share", optionalAuth, validateObjectId("id"), async (req, res) => {
  try {
    const post = await ForumPost.findOneAndUpdate(
      { _id: req.params.id, visibility: "public" },
      { $inc: { sharesCount: 1 } },
      { new: true, select: "sharesCount" }
    );
    if (!post) return res.status(404).json({ error: "Post not found." });
    return res.json({ sharesCount: post.sharesCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/forum/saved  (logged-in user's saved posts)
router.get("/saved", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const lim  = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

    const total = await ForumSave.countDocuments({ userId: req.user._id });
    const saves = await ForumSave.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate({
        path: "postId",
        populate: [
          { path: "authorId", select: "displayName username avatar" },
          { path: "gameId",   select: "title template" },
        ],
      })
      .lean();

    const ids    = saves.map((s) => s.postId?._id).filter(Boolean);
    const likes  = await ForumLike.find({ postId: { $in: ids }, userId: req.user._id }).select("postId").lean();
    const likedSet = new Set(likes.map((l) => l.postId.toString()));

    const posts = saves
      .filter((s) => s.postId)
      .map((s) => {
        const doc = s.postId;
        const author = doc.authorId
          ? { _id: doc.authorId._id, displayName: doc.authorId.displayName || doc.authorId.username, username: doc.authorId.username, avatar: doc.authorId.avatar || "" }
          : null;
        const game = doc.gameId
          ? { _id: doc.gameId._id, title: doc.gameId.title, template: doc.gameId.template }
          : null;
        return {
          ...doc,
          author,
          game,
          authorId: undefined,
          gameId:   undefined,
          isLiked:  likedSet.has(doc._id.toString()),
          isSaved:  true,
          _isOwn:   doc.authorId?._id?.toString() === req.user._id.toString(),
        };
      });

    return res.json({ posts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// COMMENTS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/forum/posts/:id/comments
router.get("/posts/:id/comments", optionalAuth, validateObjectId("id"), async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const lim  = Math.min(parseInt(limit) || 30, 50);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

    const post = await ForumPost.findOne({ _id: req.params.id, visibility: "public" }).select("_id");
    if (!post) return res.status(404).json({ error: "Post not found." });

    const total = await ForumComment.countDocuments({ postId: post._id });
    const comments = await ForumComment.find({ postId: post._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(lim)
      .populate("authorId", "displayName username avatar")
      .lean();

    const shaped = comments.map((c) => ({
      _id:     c._id,
      text:    c.text,
      createdAt: c.createdAt,
      author:  c.authorId
        ? { _id: c.authorId._id, displayName: c.authorId.displayName || c.authorId.username, username: c.authorId.username, avatar: c.authorId.avatar || "" }
        : null,
      _isOwn:  req.user ? c.authorId?._id?.toString() === req.user._id.toString() : false,
    }));

    return res.json({ comments: shaped, total, page: parseInt(page) || 1 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/forum/posts/:id/comments
router.post("/posts/:id/comments", protect, validateObjectId("id"), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Comment text is required." });
    if (text.trim().length > 500) return res.status(400).json({ error: "Comment must be under 500 characters." });

    const post = await ForumPost.findOne({ _id: req.params.id, visibility: "public" });
    if (!post) return res.status(404).json({ error: "Post not found." });

    const comment = await ForumComment.create({ postId: post._id, authorId: req.user._id, text: text.trim() });
    post.commentsCount += 1;
    await post.save();

    const shaped = {
      _id:       comment._id,
      text:      comment.text,
      createdAt: comment.createdAt,
      author:    { _id: req.user._id, displayName: req.user.displayName || req.user.username, username: req.user.username, avatar: req.user.avatar || "" },
      _isOwn:    true,
    };
    return res.status(201).json({ comment: shaped, commentsCount: post.commentsCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/forum/comments/:commentId  (own comment only)
router.delete("/comments/:commentId", protect, validateObjectId("commentId"), async (req, res) => {
  try {
    const comment = await ForumComment.findOne({ _id: req.params.commentId, authorId: req.user._id });
    if (!comment) return res.status(404).json({ error: "Comment not found." });

    await comment.deleteOne();
    await ForumPost.updateOne(
      { _id: comment.postId },
      { $inc: { commentsCount: -1 } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// FOLLOW
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/forum/teachers/:teacherId/follow  (toggle)
router.post("/teachers/:teacherId/follow", protect, validateObjectId("teacherId"), async (req, res) => {
  try {
    if (req.params.teacherId === req.user._id.toString())
      return res.status(400).json({ error: "You cannot follow yourself." });

    const target = await User.findOne({ _id: req.params.teacherId, role: { $in: ["teacher", "admin"] } }).select("_id");
    if (!target) return res.status(404).json({ error: "Teacher not found." });

    const existing = await TeacherFollow.findOne({ followerId: req.user._id, followingId: target._id });
    let following;
    if (existing) {
      await existing.deleteOne();
      following = false;
    } else {
      await TeacherFollow.create({ followerId: req.user._id, followingId: target._id });
      following = true;
    }
    const followerCount = await TeacherFollow.countDocuments({ followingId: target._id });
    return res.json({ following, followerCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/forum/teachers/:teacherId/profile
router.get("/teachers/:teacherId/profile", optionalAuth, validateObjectId("teacherId"), async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.teacherId, role: { $in: ["teacher", "admin"] } })
      .select("displayName username avatar")
      .lean();
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    const [postCount, followerCount, isFollowing] = await Promise.all([
      ForumPost.countDocuments({ authorId: teacher._id, visibility: "public" }),
      TeacherFollow.countDocuments({ followingId: teacher._id }),
      req.user ? TeacherFollow.exists({ followerId: req.user._id, followingId: teacher._id }) : false,
    ]);

    return res.json({
      teacher: {
        _id:          teacher._id,
        displayName:  teacher.displayName || teacher.username,
        username:     teacher.username,
        avatar:       teacher.avatar || "",
        postCount,
        followerCount,
        isFollowing:  !!isFollowing,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/forum/following-feed  (posts from teachers you follow)
router.get("/following-feed", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const lim  = Math.min(parseInt(limit) || 20, 50);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * lim;

    const follows = await TeacherFollow.find({ followerId: req.user._id }).select("followingId").lean();
    const followingIds = follows.map((f) => f.followingId);
    if (!followingIds.length) return res.json({ posts: [], total: 0, page: 1, pages: 0 });

    const filter = { authorId: { $in: followingIds }, visibility: "public" };
    const total  = await ForumPost.countDocuments(filter);
    const docs   = await ForumPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate("authorId", "displayName username avatar")
      .populate("gameId", "title template")
      .lean();

    const ids = docs.map((d) => d._id);
    const [likes, saves] = await Promise.all([
      ForumLike.find({ postId: { $in: ids }, userId: req.user._id }).select("postId").lean(),
      ForumSave.find({ postId: { $in: ids }, userId: req.user._id }).select("postId").lean(),
    ]);
    const likedSet = new Set(likes.map((l) => l.postId.toString()));
    const savedSet = new Set(saves.map((s) => s.postId.toString()));

    const posts = docs.map((doc) => ({
      ...doc,
      author: doc.authorId ? { _id: doc.authorId._id, displayName: doc.authorId.displayName || doc.authorId.username, username: doc.authorId.username, avatar: doc.authorId.avatar || "" } : null,
      game:   doc.gameId   ? { _id: doc.gameId._id, title: doc.gameId.title, template: doc.gameId.template } : null,
      authorId: undefined, gameId: undefined,
      isLiked: likedSet.has(doc._id.toString()),
      isSaved: savedSet.has(doc._id.toString()),
      _isOwn:  doc.authorId?._id?.toString() === req.user._id.toString(),
    }));

    return res.json({ posts, total, page: parseInt(page) || 1, pages: Math.ceil(total / lim) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUGGESTED TEACHERS  (active posters, for sidebar)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/forum/suggested-teachers
router.get("/suggested-teachers", optionalAuth, async (req, res) => {
  try {
    // Aggregate top 5 teachers by post count in last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const agg = await ForumPost.aggregate([
      { $match: { visibility: "public", createdAt: { $gte: since } } },
      { $group: { _id: "$authorId", posts: { $sum: 1 }, lastPostAt: { $max: "$createdAt" } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.role": { $in: ["teacher", "admin"] }, "user.isActive": true } },
      { $project: {
          _id:         "$user._id",
          displayName: { $ifNull: ["$user.displayName", "$user.username"] },
          username:    "$user.username",
          avatar:      { $ifNull: ["$user.avatar", ""] },
          posts:       1,
          lastPostAt:  1,
        }
      },
    ]);

    // Batch-fetch follower counts and follow status
    const ids = agg.map((t) => t._id);
    const [followerCounts, follows] = await Promise.all([
      TeacherFollow.aggregate([
        { $match: { followingId: { $in: ids } } },
        { $group: { _id: "$followingId", count: { $sum: 1 } } },
      ]),
      req.user
        ? TeacherFollow.find({ followerId: req.user._id, followingId: { $in: ids } }).select("followingId").lean()
        : Promise.resolve([]),
    ]);

    const followerMap  = new Map(followerCounts.map((f) => [f._id.toString(), f.count]));
    const followingSet = new Set(follows.map((f) => f.followingId.toString()));

    const teachers = agg.map((t) => ({
      _id:            t._id,
      displayName:    t.displayName,
      username:       t.username,
      avatar:         t.avatar,
      posts:          t.posts,
      lastPostAt:     t.lastPostAt,
      followersCount: followerMap.get(t._id.toString()) || 0,
      isFollowing:    followingSet.has(t._id.toString()),
      initial:        (t.displayName || t.username || "?")[0].toUpperCase(),
    }));

    return res.json({ teachers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
