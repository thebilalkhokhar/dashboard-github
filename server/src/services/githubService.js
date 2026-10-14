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

const fetchAllPages = (endpoint, parameters) =>
  octokit.paginate(endpoint, { ...parameters, per_page: 100 });

/**
 * Repositories fetch and upsert
 */
const syncRepositories = async (owner, repoLimit) => {
  let reposData;
  try {
    reposData = await fetchAllPages(octokit.rest.repos.listForOrg, {
      org: owner,
    });
  } catch (error) {
    if (error.status !== 404) throw error;

    reposData = (
      await fetchAllPages(octokit.rest.repos.listForAuthenticatedUser, {
        affiliation: "owner,collaborator,organization_member",
        visibility: "all",
      })
    ).filter(
      (repo) => repo.owner?.login?.toLocaleLowerCase() === owner.toLocaleLowerCase(),
    );
  }

  const savedRepos = [];
  const reposToSync =
    Number.isInteger(repoLimit) && repoLimit > 0
      ? reposData.slice(0, repoLimit)
      : reposData;

  for (const repo of reposToSync) {
    const isInactive = checkIsInactive(repo.pushed_at);
    const contributors = await fetchAllPages(
      octokit.rest.repos.listContributors,
      { owner, repo: repo.name },
    );
    const primaryContributor = contributors[0];

    const updateDoc = {
      githubRepoId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      isPrivate: Boolean(repo.private),
      topContributor: primaryContributor
        ? {
            username: primaryContributor.login,
            avatarUrl: primaryContributor.avatar_url,
            commitsCount: primaryContributor.contributions,
          }
        : { username: null, avatarUrl: null, commitsCount: 0 },
      contributors: contributors
        .filter((contributor) => contributor.login)
        .map((contributor) => ({
          username: contributor.login,
          avatarUrl: contributor.avatar_url,
          commitsCount: Number(contributor.contributions) || 0,
        })),
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

    for (const contributor of contributors) {
      if (!contributor.login) continue;

      const commitsCount = Number(contributor.contributions) || 0;
      const existingDeveloper = await DeveloperActivity.findOne({
        developerUsername: contributor.login,
      })
        .select("repoContributions")
        .lean();
      const existingContribution = existingDeveloper?.repoContributions?.find(
        (entry) => entry.repositoryId === repo.id,
      );
      const previousCommitsCount = existingContribution?.commitsCount || 0;
      const update = {
        $set: {
          avatarUrl: contributor.avatar_url,
          ...(existingContribution && {
            "repoContributions.$[repo].repositoryName": repo.name,
            "repoContributions.$[repo].commitsCount": commitsCount,
          }),
        },
        $addToSet: { activeRepos: repo.name },
        $inc: { commitsCount: commitsCount - previousCommitsCount },
      };
      const options = {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      };

      if (existingContribution) {
        options.arrayFilters = [{ "repo.repositoryId": repo.id }];
      } else {
        update.$push = {
          repoContributions: {
            repositoryId: repo.id,
            repositoryName: repo.name,
            commitsCount,
          },
        };
      }

      await DeveloperActivity.findOneAndUpdate(
        { developerUsername: contributor.login },
        update,
        options,
      );
    }
  }

  return {
    savedRepos,
    totalAvailableRepos: reposData.length,
  };
};

/**
 * Pull Requests fetch and upsert
 */
const syncPullRequestsForRepo = async (owner, repoDoc) => {
  const pulls = await fetchAllPages(octokit.rest.pulls.list, {
    owner,
    repo: repoDoc.name,
    state: "all",
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
      (reviewer) => reviewer.login && !previousReviewers.has(reviewer.login),
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

/**
 * Main Sync pipeline orchestrator
 */

const syncAllData = async (targetOwner) => {
  const owner = targetOwner || process.env.GITHUB_TARGET_OWNER;
  if (!owner) {
    throw new Error("Target GitHub owner/username must be defined.");
  }

  const repoLimit = Number(process.env.GITHUB_REPO_LIMIT);
  const hasRepoLimit = Number.isInteger(repoLimit) && repoLimit > 0;
  console.log(`[Sync] Fetching repositories for: ${owner}...`);
  const { savedRepos: reposToProcess, totalAvailableRepos } =
    await syncRepositories(owner, hasRepoLimit ? repoLimit : undefined);
  console.log(`[Sync] Repositories fetched: ${totalAvailableRepos}`);

  if (hasRepoLimit) {
    console.log(
      `[Sync] Processing ${reposToProcess.length} of ${totalAvailableRepos} repositories (GITHUB_REPO_LIMIT=${repoLimit})...`,
    );
  } else {
    console.log(
      `[Sync] Processing all ${reposToProcess.length} available repositories...`,
    );
  }

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
    totalAvailableRepos,
    syncedPrsCount: totalPrCount,
  };
};

module.exports = {
  syncRepositories,
  syncPullRequestsForRepo,
  syncAllData,
};
