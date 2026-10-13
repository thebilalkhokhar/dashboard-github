const express = require("express");
const router = express.Router();
const {
  getOverviewStats,
  getDeveloperAnalytics,
} = require("../controllers/analyticsController");

router.get("/overview", getOverviewStats);
router.get("/developers", getDeveloperAnalytics);

module.exports = router;
