"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  ClockCountdown,
  FolderSimple,
  GitPullRequest,
  Users,
  XCircle,
} from "@phosphor-icons/react";
import { fetchRepositoryDetail } from "@/lib/api";

const CONTRIBUTOR_PAGE_SIZE = 12;
const PULL_REQUEST_PAGE_SIZE = 10;

const panelClass =
  "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950";

function formatDate(value) {
  if (!value) return "No push recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PaginationControls({ page, pageSize, totalCount, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisible = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Showing {firstVisible}-{lastVisible} of {totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Previous
        </button>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function RepositoryDetailSkeleton() {
  return (
    <main
      aria-label="Loading repository details"
      aria-busy="true"
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100"
    >
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <div className="h-5 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-900" />
        <section className={`${panelClass} animate-pulse p-6`}>
          <div className="h-7 w-56 rounded bg-zinc-200 dark:bg-zinc-900" />
          <div className="mt-3 h-4 w-40 rounded bg-zinc-100 dark:bg-zinc-900/70" />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-900/70"
              />
            ))}
          </div>
        </section>
        {[...Array(2)].map((_, index) => (
          <section
            key={index}
            className={`${panelClass} h-64 animate-pulse bg-zinc-100 dark:bg-zinc-900/60`}
          />
        ))}
      </div>
    </main>
  );
}

function RepositoryDetailContent() {
  const params = useParams();
  const repoName = Array.isArray(params?.repoName)
    ? params.repoName[0]
    : params?.repoName;
  const [repositoryData, setRepositoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [contributorPage, setContributorPage] = useState(1);
  const [pullRequestPage, setPullRequestPage] = useState(1);
  const [showStuckOnly, setShowStuckOnly] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadRepository = async () => {
      setLoading(true);
      setRepositoryData(null);
      setLoadError(null);
      setContributorPage(1);
      setPullRequestPage(1);
      setShowStuckOnly(false);

      try {
        const data = await fetchRepositoryDetail(repoName);
        if (isCurrent) {
          setRepositoryData(data?.repository ? data : null);
        }
      } catch (error) {
        if (isCurrent) {
          if (error?.response?.status === 404) {
            setLoadError("not-found");
          } else {
            console.error("Failed to fetch repository details:", error);
            setLoadError("failed");
          }
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    if (repoName) void loadRepository();

    return () => {
      isCurrent = false;
    };
  }, [repoName]);

  const repository = repositoryData?.repository;
  const contributors = useMemo(() => {
    const list = repository?.contributors?.length
      ? repository.contributors
      : repository?.topContributor?.username
        ? [repository.topContributor]
        : [];
    return [...list].sort(
      (left, right) =>
        (right.commitsCount ?? 0) - (left.commitsCount ?? 0),
    );
  }, [repository]);
  const pullRequests = useMemo(
    () => repositoryData?.pullRequests ?? [],
    [repositoryData?.pullRequests],
  );
  const filteredPullRequests = useMemo(
    () =>
      showStuckOnly
        ? pullRequests.filter((pullRequest) => pullRequest.isStuck)
        : pullRequests,
    [pullRequests, showStuckOnly],
  );
  const contributorPageCount = Math.max(
    1,
    Math.ceil(contributors.length / CONTRIBUTOR_PAGE_SIZE),
  );
  const currentContributorPage = Math.min(
    contributorPage,
    contributorPageCount,
  );
  const visibleContributors = contributors.slice(
    (currentContributorPage - 1) * CONTRIBUTOR_PAGE_SIZE,
    currentContributorPage * CONTRIBUTOR_PAGE_SIZE,
  );
  const pullRequestPageCount = Math.max(
    1,
    Math.ceil(filteredPullRequests.length / PULL_REQUEST_PAGE_SIZE),
  );
  const currentPullRequestPage = Math.min(
    pullRequestPage,
    pullRequestPageCount,
  );
  const visiblePullRequests = filteredPullRequests.slice(
    (currentPullRequestPage - 1) * PULL_REQUEST_PAGE_SIZE,
    currentPullRequestPage * PULL_REQUEST_PAGE_SIZE,
  );

  if (loading) return <RepositoryDetailSkeleton />;

  if (!repository || loadError) {
    const isNotFound = loadError === "not-found" || !loadError;
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to Overview
          </Link>
          <section className={`${panelClass} px-6 py-16 text-center`}>
            {isNotFound ? (
              <XCircle
                size={28}
                className="mx-auto text-zinc-400 dark:text-zinc-500"
                aria-hidden="true"
              />
            ) : null}
            <h1 className="mt-3 text-lg font-semibold">
              {isNotFound
                ? "Repository not found"
                : "Unable to load repository"}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {isNotFound
                ? `No repository was found for "${repoName}".`
                : "Something went wrong while loading this repository. Please try again later."}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const fullName = repository.fullName || repository.name;
  const repoUrl = `https://github.com/${fullName}`;
  const healthChecks = [
    ["README", repository.healthChecks?.hasReadme],
    ["License", repository.healthChecks?.hasLicense],
    ["CI", repository.healthChecks?.hasCi],
  ];
  const overviewStats = [
    { label: "Total Contributors", value: contributors.length, Icon: Users },
    {
      label: "Total Pull Requests",
      value: pullRequests.length,
      Icon: GitPullRequest,
    },
    {
      label: "Last Pushed",
      value: formatDate(repository.lastPushedAt),
      Icon: ClockCountdown,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Overview
        </Link>

        <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FolderSimple
                size={21}
                weight="duotone"
                className="shrink-0 text-zinc-500 dark:text-zinc-400"
                aria-hidden="true"
              />
              <h1 className="break-all text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {repository.name}
              </h1>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  repository.isPrivate
                    ? "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {repository.isPrivate ? "Private" : "Public"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  repository.isInactive
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {repository.isInactive ? (
                  <ClockCountdown size={12} aria-hidden="true" />
                ) : null}
                {repository.isInactive ? ">90d Inactive" : "Active"}
              </span>
            </div>
            <p className="mt-2 break-all text-sm text-zinc-500 dark:text-zinc-400">
              {fullName}
            </p>
          </div>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            View on GitHub
            <ArrowSquareOut size={15} aria-hidden="true" />
          </a>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="mr-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Health checks
          </span>
          {healthChecks.map(([label, passed]) => (
            <span
              key={label}
              title={`${label}: ${passed ? "available" : "not detected"}`}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
                passed
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
              }`}
            >
              {passed ? (
                <CheckCircle size={14} weight="bold" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">—</span>
              )}
              {label}
            </span>
          ))}
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {overviewStats.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black"
            >
              <dt className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Icon size={14} aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1.5 break-words text-lg font-semibold tabular-nums text-zinc-950 dark:text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        </section>

        <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Users
              size={19}
              weight="duotone"
              className="text-zinc-600 dark:text-zinc-300"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold">Contributors</h2>
            <span className="text-xs text-zinc-500">{contributors.length}</span>
          </div>
        </div>
        {visibleContributors.length ? (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleContributors.map((contributor, index) => {
              const rank =
                (currentContributorPage - 1) * CONTRIBUTOR_PAGE_SIZE +
                index +
                1;
              return (
                <li
                  key={contributor.username}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-black"
                >
                  <Image
                    src={
                      contributor.avatarUrl || "https://github.com/ghost.png"
                    }
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/developers/${encodeURIComponent(contributor.username)}`}
                      className="block truncate text-sm font-medium text-zinc-900 hover:underline dark:text-white"
                    >
                      @{contributor.username}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {contributor.commitsCount ?? 0} commits
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-200/70 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    #{rank}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No contributors are recorded for this repository.
          </p>
        )}
        <PaginationControls
          page={currentContributorPage}
          pageSize={CONTRIBUTOR_PAGE_SIZE}
          totalCount={contributors.length}
          onPageChange={(nextPage) =>
            setContributorPage(
              Math.min(Math.max(nextPage, 1), contributorPageCount),
            )
          }
        />
        </section>

        <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <GitPullRequest
              size={19}
              weight="duotone"
              className="text-zinc-600 dark:text-zinc-300"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold">Pull Requests</h2>
            <span className="text-xs text-zinc-500">
              {filteredPullRequests.length}
            </span>
          </div>
          <div
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/60"
            aria-label="Filter pull requests"
          >
            <button
              type="button"
              aria-pressed={!showStuckOnly}
              onClick={() => {
                setShowStuckOnly(false);
                setPullRequestPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !showStuckOnly
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              All PRs ({pullRequests.length})
            </button>
            <button
              type="button"
              aria-pressed={showStuckOnly}
              onClick={() => {
                setShowStuckOnly(true);
                setPullRequestPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                showStuckOnly
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              Stuck ({pullRequests.filter((pullRequest) => pullRequest.isStuck).length})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">PR Number</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Stuck</th>
                <th className="px-5 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
              {visiblePullRequests.length ? (
                visiblePullRequests.map((pullRequest) => {
                  const author = pullRequest.authorGithubId || "unknown";
                  const stateStyles =
                    pullRequest.state === "merged"
                      ? "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : pullRequest.state === "closed"
                        ? "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
                  const pullRequestUrl =
                    pullRequest.htmlUrl ||
                    `${repoUrl}/pull/${pullRequest.prNumber}`;

                  return (
                    <tr
                      key={pullRequest._id || pullRequest.prNumber}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium">
                        #{pullRequest.prNumber}
                      </td>
                      <td className="max-w-sm px-5 py-3.5 font-medium text-zinc-900 dark:text-white">
                        <span className="line-clamp-2">
                          {pullRequest.title}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {author === "unknown" ? (
                          "@unknown"
                        ) : (
                          <Link
                            href={`/developers/${encodeURIComponent(author)}`}
                            className="hover:underline"
                          >
                            @{author}
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${stateStyles}`}
                        >
                          {pullRequest.state || "open"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {pullRequest.isStuck ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <ClockCountdown size={13} aria-hidden="true" />
                            Stuck
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">No</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={pullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                        >
                          View ↗
                          <ArrowSquareOut size={13} aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {showStuckOnly
                      ? "No stuck pull requests found."
                      : "No pull requests found for this repository."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          page={currentPullRequestPage}
          pageSize={PULL_REQUEST_PAGE_SIZE}
          totalCount={filteredPullRequests.length}
          onPageChange={(nextPage) =>
            setPullRequestPage(
              Math.min(Math.max(nextPage, 1), pullRequestPageCount),
            )
          }
        />
        </section>
      </div>
    </main>
  );
}

export default function RepositoryDetailPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<RepositoryDetailSkeleton />}>
        <RepositoryDetailContent />
      </Suspense>
    </AuthGuard>
  );
}
