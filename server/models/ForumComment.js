const mongoose = require("mongoose");

const forumCommentSchema = new mongoose.Schema(
  {
    postId:   { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:     { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

forumCommentSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model("ForumComment", forumCommentSchema);
