const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: String,
      required: true,
      trim: true,
    },
    starsEarned: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameResult", gameResultSchema);
