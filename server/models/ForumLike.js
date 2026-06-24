const mongoose = require("mongoose");

const forumLikeSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

forumLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("ForumLike", forumLikeSchema);
