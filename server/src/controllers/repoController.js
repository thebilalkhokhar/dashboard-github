const Repository = require("../models/Repository");

/**
 * Fetch all repositories with filters (search, inactivity, unowned)
 */
const getAllRepos = async (req, res) => {
  try {
    const { search, isInactive, unowned, team } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (isInactive !== undefined) {
      query.isInactive = isInactive === "true";
    }
    if (unowned === "true") {
      query.manualOwner = null;
    }
    if (team) {
      query.team = team;
    }

    const repos = await Repository.find(query)
      .populate("manualOwner", "username avatarUrl role")
      .sort({ lastPushedAt: -1 });

    return res.status(200).json({
      success: true,
      count: repos.length,
      data: repos,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * P1 Feature: Inactive Repositories (no push in 90+ days)
 */
const getInactiveRepos = async (req, res) => {
  try {
    const repos = await Repository.find({ isInactive: true })
      .populate("manualOwner", "username avatarUrl")
      .sort({ lastPushedAt: 1 });

    return res.status(200).json({
      success: true,
      count: repos.length,
      data: repos,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * P1 Feature: Assign repo owner manually (by Lead / Manager)
 */
const updateRepoOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const repo = await Repository.findByIdAndUpdate(
      id,
      { manualOwner: userId || null },
      { returnDocument: "after" },
    ).populate("manualOwner", "username avatarUrl");

    if (!repo) {
      return res
        .status(404)
        .json({ success: false, message: "Repository not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Repository owner updated successfully.",
      data: repo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllRepos,
  getInactiveRepos,
  updateRepoOwner,
};
