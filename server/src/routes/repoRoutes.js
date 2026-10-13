const express = require("express");
const router = express.Router();
const { getAllRepos, getInactiveRepos } = require("../controllers/repoController");

router.get("/", getAllRepos);
router.get("/inactive", getInactiveRepos);

module.exports = router;
