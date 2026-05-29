const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["story-series", "quick-video", "song"],
      required: true,
    },
    videoUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: "" },
    // Series name or topic — free text, e.g. "Sea Adventure", "Animals", "Kindness"
    field: { type: String, default: "", trim: true },
    characterName: { type: String, default: "" },
    episodeNumber: { type: Number, default: null }, // for story-series only
    unit: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

videoSchema.index({ type: 1, isPublished: 1 });
videoSchema.index({ field: 1, type: 1, episodeNumber: 1 });
videoSchema.index({ views: -1 });

module.exports = mongoose.model("Video", videoSchema);
