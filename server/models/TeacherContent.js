const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  { word: { type: String, required: true }, imageUrl: { type: String, default: "" }, audioUrl: { type: String, default: "" } },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: { validator: (v) => v.length >= 2 && v.length <= 4, message: "2–4 options required" },
    },
    correctAnswer: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
  },
  { _id: false }
);

questionSchema.pre("validate", function () {
  if (this.options && this.correctAnswer && !this.options.includes(this.correctAnswer)) {
    this.invalidate("correctAnswer", "correctAnswer must be one of the options");
  }
});

const listenChoiceSchema = new mongoose.Schema(
  { imageUrl: { type: String, default: "" }, label: { type: String, default: "" } },
  { _id: false }
);

const listenItemSchema = new mongoose.Schema(
  {
    word:         { type: String, default: "" },
    audioUrl:     { type: String, default: "" },
    choices:      { type: [listenChoiceSchema], default: () => [{}, {}, {}, {}] },
    correctIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const teacherContentSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["game", "quiz", "listen"], required: true },
    template: {
      type: String,
      enum: ["match-word-picture", "memory-card", "quiz", "listen-choose-picture"],
      required: true,
    },
    items:       [itemSchema],
    questions:   [questionSchema],
    listenItems: [listenItemSchema],
    assignedClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
    isPublished: { type: Boolean, default: false },
    playLimit:   { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherContent", teacherContentSchema);
