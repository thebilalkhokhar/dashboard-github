const Repository = require("../models/Repository");
const PullRequest = require("../models/PullRequest");
const DeveloperActivity = require("../models/DeveloperActivity");

/**
 * High-level overview stats for summary cards
 */
const getOverviewStats = async (req, res) => {
  try {
    const [totalRepos, inactiveRepos, openPrs, stuckPrs, totalActiveDevs] =
      await Promise.all([
        Repository.countDocuments(),
        Repository.countDocuments({ isInactive: true }),
        PullRequest.countDocuments({ state: "open" }),
        PullRequest.countDocuments({ state: "open", isStuck: true }),
        DeveloperActivity.countDocuments({
          developerUsername: { $not: /\[bot\]$/i },
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRepos,
        inactiveRepos,
        openPrs,
        stuckPrs,
        totalActiveDevs,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Developer leaderboard & workload list
 */
const getDeveloperAnalytics = async (req, res) => {
  try {
    const { includeBots = "false", sortBy = "prsOpenedCount" } = req.query;

    const query = {};
    if (includeBots !== "true") {
      // Exclude GitHub bots from real rankings
      query.developerUsername = { $not: /\[bot\]$/i };
    }

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    const developers = await DeveloperActivity.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: developers.length,
      data: developers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDeveloperDetail = async (req, res) => {
  try {
    const { username } = req.params;
    const developer = await DeveloperActivity.findOne({
      developerUsername: username,
    });

    if (!developer) {
      return res
        .status(404)
        .json({ success: false, message: "Developer not found" });
    }

    const pullRequests = await PullRequest.find({ authorGithubId: username })
      .populate("repository", "name fullName")
      .sort({ openedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        developer,
        pullRequests,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverviewStats,
  getDeveloperAnalytics,
  getDeveloperDetail,
};
