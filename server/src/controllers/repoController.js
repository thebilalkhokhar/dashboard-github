const Repository = require("../models/Repository");

/**
 * Fetch all repositories with filters (search, inactivity, team)
 */
const getAllRepos = async (req, res) => {
  try {
    const { search, isInactive, team } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (isInactive !== undefined) {
      query.isInactive = isInactive === "true";
    }
    if (team) {
      query.team = team;
    }

    const repos = await Repository.find(query)
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

module.exports = {
  getAllRepos,
  getInactiveRepos,
};
