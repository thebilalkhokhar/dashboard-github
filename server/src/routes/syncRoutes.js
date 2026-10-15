const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const { getSyncStatus, triggerSync } = require("../controllers/syncController");

router.use(protect);

router.get("/status", getSyncStatus);
router.post("/trigger", triggerSync);

module.exports = router;
