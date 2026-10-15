const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getSettings,
  updateSettings,
  subscribePush,
  getVapidPublicKey,
  testPush,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/subscribe", subscribePush);
router.get("/vapid-key", getVapidPublicKey);
router.post("/test-push", testPush);

module.exports = router;
