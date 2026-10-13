const mongoose = require("mongoose");
require("./User"); // User will be referenced in the Repository schema, so we need to ensure it's loaded

const repoSchema = new mongoose.Schema(
  {
    githubRepoId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    team: { type: String, default: null },
    manualOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
