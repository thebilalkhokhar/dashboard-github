const mongoose = require("mongoose");

const repoSchema = new mongoose.Schema(
  {
    githubRepoId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    isPrivate: { type: Boolean, default: false },
    team: { type: String, default: null },
    topContributor: {
      username: { type: String },
      avatarUrl: { type: String },
      commitsCount: { type: Number, default: 0 },
    },
    contributors: [
      {
        username: { type: String, required: true },
        avatarUrl: { type: String },
        commitsCount: { type: Number, default: 0 },
      },
    ],
    openPrsCount: { type: Number, default: 0 },
    lastPushedAt: { type: Date, index: true },
    isInactive: { type: Boolean, default: false },
    healthChecks: {
      hasReadme: { type: Boolean, default: false },
      hasLicense: { type: Boolean, default: false },
      hasCi: { type: Boolean, default: false },
      hasBranchProtection: { type: Boolean, default: false },
      hasCodeowners: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Repository", repoSchema);
