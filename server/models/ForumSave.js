const mongoose = require("mongoose");

const forumSaveSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

forumSaveSchema.index({ postId: 1, userId: 1 }, { unique: true });
forumSaveSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ForumSave", forumSaveSchema);
