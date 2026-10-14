const { syncAllData } = require("../services/githubService");

let syncStatus = {
  status: "idle",
  phase: null,
  completedRepositories: 0,
  totalRepositories: 0,
  syncedPullRequests: 0,
  currentRepository: null,
  startedAt: null,
  updatedAt: null,
  error: null,
};

const getSyncStatus = (req, res) => {
  return res.status(200).json({ success: true, data: syncStatus });
};

const triggerSync = async (req, res) => {
  if (syncStatus.status === "running") {
    return res.status(409).json({
      success: false,
      message: "A sync is already in progress.",
    });
  }

  const startedAt = new Date().toISOString();
  syncStatus = {
    status: "running",
    phase: "starting",
    completedRepositories: 0,
    totalRepositories: 0,
    syncedPullRequests: 0,
    currentRepository: null,
    startedAt,
    updatedAt: startedAt,
    error: null,
  };

  try {
    const result = await syncAllData(undefined, (progress) => {
      syncStatus = {
        ...syncStatus,
        ...progress,
        updatedAt: new Date().toISOString(),
      };
    });

    syncStatus = {
      ...syncStatus,
      status: "completed",
      phase: "completed",
      completedRepositories: result.syncedReposCount,
      totalRepositories: result.syncedReposCount,
      syncedPullRequests: result.syncedPrsCount,
      currentRepository: null,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "GitHub data successfully synced with database.",
      data: result,
    });
  } catch (error) {
    console.error("Sync Error:", error.message);
    syncStatus = {
      ...syncStatus,
      status: "failed",
      phase: "failed",
      currentRepository: null,
      error: error.message || "Sync operation failed.",
      updatedAt: new Date().toISOString(),
    };
    return res.status(500).json({
      success: false,
      message: error.message || "Sync operation failed.",
    });
  }
};

module.exports = {
  getSyncStatus,
  triggerSync,
};
