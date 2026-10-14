const mongoose = require("mongoose");

const developerActivitySchema = new mongoose.Schema(
  {
    developerUsername: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    avatarUrl: { type: String },
    commitsCount: { type: Number, default: 0 },
    prsOpenedCount: { type: Number, default: 0 },
    prsReviewedCount: { type: Number, default: 0 },
    activeRepos: [{ type: String }],
    repoContributions: [
      {
        repositoryId: { type: Number, required: true },
        repositoryName: { type: String, required: true },
        commitsCount: { type: Number, default: 0 },
      },
    ],
    lastActiveAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DeveloperActivity", developerActivitySchema);
