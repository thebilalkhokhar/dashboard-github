const express = require("express");
const router = express.Router();
const { getStuckPRs, getPRs } = require("../controllers/prController");
const protect = require("../middlewares/authMiddleware");

router.use(protect);

router.get("/", getPRs);
router.get("/stuck", getStuckPRs);

module.exports = router;
