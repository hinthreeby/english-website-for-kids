const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    authorId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:         { type: String, enum: ["game", "text", "image", "video", "audio"], required: true },
    title:        { type: String, required: true, trim: true, maxlength: 120 },
    description:  { type: String, default: "", maxlength: 1000 },
    tags:         { type: [String], default: [] },
    gameId:       { type: mongoose.Schema.Types.ObjectId, ref: "TeacherContent", default: null },
    mediaUrl:     { type: String, default: "" },
    visibility:   { type: String, enum: ["public", "private"], default: "public" },
    likesCount:    { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount:    { type: Number, default: 0 },
    sharesCount:   { type: Number, default: 0 },
    viewsCount:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

forumPostSchema.index({ visibility: 1, createdAt: -1 });
forumPostSchema.index({ authorId: 1, createdAt: -1 });
forumPostSchema.index({ type: 1, visibility: 1, createdAt: -1 });
forumPostSchema.index({ tags: 1, visibility: 1 });

module.exports = mongoose.model("ForumPost", forumPostSchema);
