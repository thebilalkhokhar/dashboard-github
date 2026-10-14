const express = require("express");
const router = express.Router();
const {
  getOverviewStats,
  getDeveloperAnalytics,
  getDeveloperDetail,
} = require("../controllers/analyticsController");

router.get("/overview", getOverviewStats);
router.get("/developers", getDeveloperAnalytics);
router.get("/developers/:username", getDeveloperDetail);

module.exports = router;
