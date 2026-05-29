const mongoose = require("mongoose");

const videoViewSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  watchedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VideoView", videoViewSchema);
