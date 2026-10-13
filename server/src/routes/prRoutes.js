const express = require("express");
const router = express.Router();
const { getStuckPRs, getPRs } = require("../controllers/prController");

router.get("/", getPRs);
router.get("/stuck", getStuckPRs);

module.exports = router;
