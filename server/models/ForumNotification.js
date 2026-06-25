const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User",      required: true },
    actorId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",      required: true },
    type:        { type: String, enum: ["new_post", "like", "comment", "follow"], required: true },
    postId:      { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", default: null },
    isRead:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ recipientId: 1, createdAt: -1 });
schema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model("ForumNotification", schema);
