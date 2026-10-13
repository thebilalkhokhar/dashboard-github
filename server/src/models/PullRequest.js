const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    prNumber: { type: Number, required: true },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    htmlUrl: { type: String },
    authorGithubId: { type: String, required: true, index: true },
    reviewers: [{ type: String }],
    state: {
      type: String,
      enum: ["open", "closed", "merged"],
      default: "open",
    },
    isStuck: { type: Boolean, default: false },
    reviewTimeHours: { type: Number, default: 0 },
    openedAt: { type: Date, required: true },
    mergedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pullRequestSchema.index({ repository: 1, prNumber: 1 }, { unique: true });

module.exports = mongoose.model("PullRequest", pullRequestSchema);
