const { syncAllData } = require("../services/githubService");

const triggerSync = async (req, res) => {
  try {
    const result = await syncAllData();

    return res.status(200).json({
      success: true,
      message: "GitHub data successfully synced with database.",
      data: result,
    });
  } catch (error) {
    console.error("Sync Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Sync operation failed.",
    });
  }
};

module.exports = {
  triggerSync,
};
