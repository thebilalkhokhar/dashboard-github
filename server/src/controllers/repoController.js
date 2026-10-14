const Repository = require("../models/Repository");

const getRepositories = async (req, res, inactiveOnly = false) => {
  try {
    const { search, isInactive, team, sortBy } = req.query;
    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 100;
    const query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { fullName: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (inactiveOnly) {
      query.isInactive = true;
    } else if (isInactive !== undefined) {
      query.isInactive = isInactive === "true";
    }
    if (team) {
      query.team = team;
    }

    const sort =
      sortBy === "name"
        ? { name: 1 }
        : sortBy === "openPrsCount"
          ? { openPrsCount: -1 }
          : { lastPushedAt: inactiveOnly ? 1 : -1 };
    const [count, repos] = await Promise.all([
      Repository.countDocuments(query),
      Repository.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      count,
      data: repos,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalCount: count,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllRepos = (req, res) => getRepositories(req, res);

/**
 * P1 Feature: Inactive Repositories (no push in 90+ days)
 */
const getInactiveRepos = (req, res) => getRepositories(req, res, true);

module.exports = {
  getAllRepos,
  getInactiveRepos,
};
