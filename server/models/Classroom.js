const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinCode: {
      type: String,
      unique: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    wordLists: [{ type: mongoose.Schema.Types.ObjectId, ref: "WordList" }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classroomSchema.pre("save", function () {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model("Classroom", classroomSchema);
