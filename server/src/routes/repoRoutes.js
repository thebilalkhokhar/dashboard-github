const express = require("express");
const router = express.Router();
const {
  getAllRepos,
  getInactiveRepos,
  updateRepoOwner,
} = require("../controllers/repoController");

router.get("/", getAllRepos);
router.get("/inactive", getInactiveRepos);
router.patch("/:id/owner", updateRepoOwner);

module.exports = router;
