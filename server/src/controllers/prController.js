const PullRequest = require("../models/PullRequest");

/**
 * P1 Feature: Stuck PR list (Open & pending review beyond threshold)
 */
const getStuckPRs = async (req, res) => {
  try {
    const stuckPRs = await PullRequest.find({
      state: "open",
      isStuck: true,
    })
      .populate("repository", "name fullName isInactive")
      .sort({ openedAt: 1 });

    return res.status(200).json({
      success: true,
      count: stuckPRs.length,
      data: stuckPRs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * All PRs for a specific repo or status
 */
const getPRs = async (req, res) => {
  try {
    const { repoId, state } = req.query;
    const query = {};

    if (repoId) query.repository = repoId;
    if (state) query.state = state;

    const prs = await PullRequest.find(query)
      .populate("repository", "name")
      .sort({ openedAt: -1 });

    return res.status(200).json({
      success: true,
      count: prs.length,
      data: prs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStuckPRs,
  getPRs,
};
