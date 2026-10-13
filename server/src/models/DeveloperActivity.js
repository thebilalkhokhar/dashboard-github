const mongoose = require("mongoose");

const developerActivitySchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    windowStartDate: { type: Date, required: true },
    commitsCount: { type: Number, default: 0 },
    prsOpened: { type: Number, default: 0 },
    reviewsSubmitted: { type: Number, default: 0 },
    assignedIssuesCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { timestamps: true },
);

developerActivitySchema.index(
  { developer: 1, repository: 1 },
  { unique: true },
);

module.exports = mongoose.model("DeveloperActivity", developerActivitySchema);
