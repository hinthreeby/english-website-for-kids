const mongoose = require("mongoose");

const roadmapProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
    },
    completedUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoadmapUnit",
      },
    ],
    unlockedUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoadmapUnit",
      },
    ],
    currentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapUnit",
      default: null,
    },
    stars: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

roadmapProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

module.exports = mongoose.model("RoadmapProgress", roadmapProgressSchema);
