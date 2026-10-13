const express = require("express");
const router = express.Router();
const { triggerSync } = require("../controllers/syncController");

router.post("/trigger", triggerSync);

module.exports = router;
