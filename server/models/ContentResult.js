const mongoose = require("mongoose");

const contentResultSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherContent", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

contentResultSchema.index({ contentId: 1, studentId: 1 });

module.exports = mongoose.model("ContentResult", contentResultSchema);
