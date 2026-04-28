const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  emoji: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  category: { type: String, default: "general" },
});

const wordListSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    words: [wordSchema],
    isPublished: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    gameType: {
      type: String,
      enum: ["picture-words", "abc-letters", "space-pronounce", "funny-animals", "all"],
      default: "all",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WordList", wordListSchema);
