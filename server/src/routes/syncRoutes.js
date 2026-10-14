const express = require("express");
const router = express.Router();
const { getSyncStatus, triggerSync } = require("../controllers/syncController");

router.get("/status", getSyncStatus);
router.post("/trigger", triggerSync);

module.exports = router;
