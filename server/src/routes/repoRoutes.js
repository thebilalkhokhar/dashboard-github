const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getAllRepos,
  getInactiveRepos,
  getRepoDetail,
} = require("../controllers/repoController");

router.use(protect);

router.get("/", getAllRepos);
router.get("/inactive", getInactiveRepos);
router.get("/:repoName", getRepoDetail);

module.exports = router;
