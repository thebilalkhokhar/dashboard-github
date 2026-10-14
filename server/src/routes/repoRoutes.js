const express = require("express");
const router = express.Router();
const {
  getAllRepos,
  getInactiveRepos,
  getRepoDetail,
} = require("../controllers/repoController");

router.get("/", getAllRepos);
router.get("/inactive", getInactiveRepos);
router.get("/:repoName", getRepoDetail);

module.exports = router;
