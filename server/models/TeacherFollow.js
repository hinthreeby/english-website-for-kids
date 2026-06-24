const mongoose = require("mongoose");

const teacherFollowSchema = new mongoose.Schema(
  {
    followerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

teacherFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
teacherFollowSchema.index({ followingId: 1 });

module.exports = mongoose.model("TeacherFollow", teacherFollowSchema);
