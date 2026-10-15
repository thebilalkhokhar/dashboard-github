const NotificationSetting = require("../models/NotificationSetting");
const Repository = require("../models/Repository");
const PullRequest = require("../models/PullRequest");
const { sendPushNotification } = require("./pushNotifier");

const evaluateAndTriggerAlerts = async (userId) => {
  const settings = await NotificationSetting.findOne({ user: userId }).lean();
  if (
    !settings ||
    !settings.browserPushEnabled ||
    !settings.pushSubscriptions?.length
  ) {
    return { inactiveRepositories: 0, stuckPullRequests: 0 };
  }

  const notifications = [];
  let inactiveRepositoryCount = 0;
  let stuckPullRequestCount = 0;

  if (settings.inactiveRepoAlerts) {
    const inactiveBefore = new Date(
      Date.now() - settings.inactiveRepoDays * 24 * 60 * 60 * 1000,
    );
    const inactiveRepositories = await Repository.find({
      isInactive: false,
      lastPushedAt: { $lt: inactiveBefore },
    })
      .select("_id name")
      .lean();

    inactiveRepositoryCount = inactiveRepositories.length;
    for (const repo of inactiveRepositories) {
      notifications.push({
        title: "Inactive Repository Alert",
        body: `${repo.name} has had no commits for over ${settings.inactiveRepoDays} days.`,
        url: `/repos/${repo.name}`,
        tag: `inactive-repo-${repo._id}`,
      });
    }
  }

  if (settings.stuckPrAlerts) {
    const inactiveBefore = new Date(
      Date.now() - settings.stuckPrHours * 60 * 60 * 1000,
    );
    const stuckPullRequests = await PullRequest.find({
      state: "open",
      $or: [
        { lastActivityAt: { $lt: inactiveBefore } },
        {
          lastActivityAt: null,
          openedAt: { $lt: inactiveBefore },
        },
      ],
    })
      .populate("repository", "name")
      .lean();

    for (const pullRequest of stuckPullRequests) {
      if (!pullRequest.repository) {
        continue;
      }

      stuckPullRequestCount += 1;
      notifications.push({
        title: "Stuck Pull Request Alert",
        body: `PR #${pullRequest.prNumber} in ${pullRequest.repository.name} has been pending for over ${settings.stuckPrHours} hours.`,
        url: `/repos/${pullRequest.repository.name}`,
        tag: `stuck-pr-${pullRequest.repository._id}-${pullRequest.prNumber}`,
      });
    }
  }

  const results = await Promise.allSettled(
    notifications.map((notification) =>
      sendPushNotification(userId, notification),
    ),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Alert push delivery failed:",
        result.reason?.message || result.reason,
      );
    }
  });

  return {
    inactiveRepositories: inactiveRepositoryCount,
    stuckPullRequests: stuckPullRequestCount,
  };
};

module.exports = { evaluateAndTriggerAlerts };
