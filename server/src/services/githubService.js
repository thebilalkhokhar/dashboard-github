const { Octokit } = require("@octokit/rest");
const Repository = require("../models/Repository");
const PullRequest = require("../models/PullRequest");
const DeveloperActivity = require("../models/DeveloperActivity");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Identify if a repository is inactive based on the last pushed date. Agar last pushed date 90 din se purana hai to inactive consider karein
 */
const checkIsInactive = (lastPushedAt) => {
  if (!lastPushedAt) return true;
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(lastPushedAt).getTime() > ninetyDaysInMs;
};

/**
 * Stuck PR rule: If a PR is open for more than 5 days without any activity, consider it stuck.
 */
const checkIsStuck = (createdAt) => {
  const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() > fiveDaysInMs;
};

/**
 * Repositories fetch and upsert
 */
const syncRepositories = async (owner) => {
  // if owner is an org, use listForOrg, else use listForUser
  let reposData = [];
  try {
    const res = await octokit.rest.repos.listForOrg({
      org: owner,
      per_page: 100,
    });
    reposData = res.data;
  } catch {
    const res = await octokit.rest.repos.listForUser({
      username: owner,
      per_page: 100,
    });
    reposData = res.data;
  }

  const savedRepos = [];

  for (const repo of reposData) {
    const isInactive = checkIsInactive(repo.pushed_at);
    const { data: contributors } = await octokit.rest.repos.listContributors({
      owner,
      repo: repo.name,
      per_page: 100,
    });
    const primaryContributor = contributors[0];

    const updateDoc = {
      githubRepoId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      topContributor: primaryContributor
        ? {
            username: primaryContributor.login,
            avatarUrl: primaryContributor.avatar_url,
            commitsCount: primaryContributor.contributions,
          }
        : { username: null, avatarUrl: null, commitsCount: 0 },
      lastPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      isInactive,
      healthChecks: {
        hasReadme: !repo.archived, // Initial placeholder check
        hasLicense: Boolean(repo.license),
        hasCi: false,
        hasBranchProtection: false,
        hasCodeowners: false,
      },
    };

    const saved = await Repository.findOneAndUpdate(
      { githubRepoId: repo.id },
      { $set: updateDoc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    savedRepos.push(saved);
  }

  return savedRepos;
};

/**
 * Pull Requests fetch and upsert
 */
const syncPullRequestsForRepo = async (owner, repoDoc) => {
  const { data: pulls } = await octokit.rest.pulls.list({
    owner,
    repo: repoDoc.name,
    state: "all",
    per_page: 50,
  });

  const savedPRs = [];

  for (const pr of pulls) {
    const isStuck = pr.state === "open" && checkIsStuck(pr.created_at);
    const previousPR = await PullRequest.findOne({
      repository: repoDoc._id,
      prNumber: pr.number,
    }).lean();

    const updateDoc = {
      prNumber: pr.number,
      repository: repoDoc._id,
      title: pr.title,
      htmlUrl: pr.html_url,
      authorGithubId: pr.user?.login || "unknown",
      reviewers: pr.requested_reviewers?.map((r) => r.login) || [],
      state: pr.state,
      isStuck,
      openedAt: new Date(pr.created_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
    };

    const saved = await PullRequest.findOneAndUpdate(
      { repository: repoDoc._id, prNumber: pr.number },
      { $set: updateDoc },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    savedPRs.push(saved);

    const lastActiveAt = new Date(pr.updated_at || pr.created_at);
    const repoName = repoDoc.name;
    const authorUsername = pr.user?.login;

    if (authorUsername) {
      await DeveloperActivity.findOneAndUpdate(
        { developerUsername: authorUsername },
        {
          $set: {
            avatarUrl: pr.user.avatar_url,
            lastActiveAt,
          },
          $inc: { prsOpenedCount: previousPR ? 0 : 1 },
          $addToSet: { activeRepos: repoName },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    const previousReviewers = new Set(previousPR?.reviewers || []);
    const newReviewers = (pr.requested_reviewers || []).filter(
      (reviewer) =>
        reviewer.login && !previousReviewers.has(reviewer.login),
    );

    for (const reviewer of newReviewers) {
      await DeveloperActivity.findOneAndUpdate(
        { developerUsername: reviewer.login },
        {
          $set: {
            lastActiveAt,
            ...(reviewer.avatar_url && { avatarUrl: reviewer.avatar_url }),
          },
          $inc: { prsReviewedCount: 1 },
          $addToSet: { activeRepos: repoName },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
  }

  await Repository.updateOne(
    { _id: repoDoc._id },
    {
      $set: {
        openPrsCount: pulls.filter((pr) => pr.state === "open").length,
      },
    },
  );

  return savedPRs;
};

// /**
//  * Main Sync pipeline orchestrator
//  */
// const syncAllData = async (targetOwner) => {
//   const owner = targetOwner || process.env.GITHUB_TARGET_OWNER;
//   if (!owner) {
//     throw new Error("Target GitHub owner/username lazmi define karein.");
//   }

//   const repos = await syncRepositories(owner);
//   let totalPrCount = 0;

//   // Har synced repo ke liye PRs pull karna
//   for (const repo of repos) {
//     const prs = await syncPullRequestsForRepo(owner, repo);
//     totalPrCount += prs.length;
//   }

//   return {
//     syncedReposCount: repos.length,
//     syncedPrsCount: totalPrCount,
//   };
// };

/**
 * Main Sync pipeline orchestrator
 */
const syncAllData = async (targetOwner) => {
  const owner = targetOwner || process.env.GITHUB_TARGET_OWNER;
  if (!owner) {
    throw new Error("Target GitHub owner/username lazmi define karein.");
  }

  console.log(`[Sync] Fetching repositories for: ${owner}...`);
  const repos = await syncRepositories(owner);
  console.log(`[Sync] Repositories fetched: ${repos.length}`);

  // Point 2: Limit the number of repos to process for testing purposes. For example, only process the first 5 repos.
  const reposToProcess = repos.slice(0, 5);
  console.log(
    `[Sync] Processing first ${reposToProcess.length} repos for testing...`,
  );

  let totalPrCount = 0;

  // Point 1: console log for each repo being processed
  for (let i = 0; i < reposToProcess.length; i++) {
    const repo = reposToProcess[i];
    console.log(
      `[Sync] (${i + 1}/${reposToProcess.length}) Fetching PRs for: ${repo.name}`,
    );

    const prs = await syncPullRequestsForRepo(owner, repo);
    totalPrCount += prs.length;
  }

  console.log(
    `[Sync] Done! Processed ${reposToProcess.length} repos and ${totalPrCount} PRs.`,
  );

  return {
    syncedReposCount: reposToProcess.length,
    totalAvailableRepos: repos.length,
    syncedPrsCount: totalPrCount,
  };
};

module.exports = {
  syncRepositories,
  syncPullRequestsForRepo,
  syncAllData,
};
