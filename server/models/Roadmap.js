const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    theme: {
      type: String,
      default: "space",
    },
    order: {
      type: Number,
      default: 1,
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoadmapUnit",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
