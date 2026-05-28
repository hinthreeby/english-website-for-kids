const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, default: "multiple-choice" },
    questionText: { type: String, default: "" },
    options: [String],
    correctAnswer: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { _id: false }
);

const roadmapUnitSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
    },
    unitNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    planetName: {
      type: String,
      required: true,
      trim: true,
    },
    imageKey: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
    questions: [questionSchema],
    isLockedDefault: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoadmapUnit", roadmapUnitSchema);
