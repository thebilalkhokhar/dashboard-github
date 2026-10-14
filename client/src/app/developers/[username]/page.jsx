"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  ClockCountdown,
  FolderSimple,
  GitMerge,
  GitPullRequest,
} from "@phosphor-icons/react";
import { fetchDeveloperDetail } from "@/lib/api";
import TablePagination from "@/components/TablePagination";

const PAGE_SIZE = 10;

const formatLastActive = (value) => {
  if (!value) return "No activity recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown activity date";

  return `Last active ${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
};

const pullRequestState = (state) => {
  if (state === "merged") {
    return {
      label: "Merged",
      Icon: GitMerge,
      className:
        "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }

  if (state === "closed") {
    return {
      label: "Closed",
      Icon: CheckCircle,
      className:
        "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
    };
  }

  return {
    label: "Open",
    Icon: GitPullRequest,
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
};

function ProfileSkeleton() {
  return (
    <main
      aria-label="Loading developer profile"
      aria-busy="true"
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100"
    >
      <div className="max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <div className="h-5 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-900" />
        <section className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-900" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-900" />
              <div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-900/70" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-900/70"
              />
            ))}
          </div>
        </section>
        <section className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
        <section className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
      </div>
    </main>
  );
}

function DeveloperProfileContent() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, username: null });

  useEffect(() => {
    let isCurrent = true;

    const loadProfile = async () => {
      setLoading(true);
      setProfile(null);

      try {
        const data = await fetchDeveloperDetail(username);
        if (isCurrent) setProfile(data?.developer ? data : null);
      } catch (error) {
        if (isCurrent) setProfile(null);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    if (username) void loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [username]);

  if (loading) return <ProfileSkeleton />;

  if (!profile?.developer) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to Dashboard
          </Link>
          <section className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="text-lg font-semibold">Developer not found</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No activity profile was found for @{username}.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const { developer, pullRequests = [] } = profile;
  const pageCount = Math.max(1, Math.ceil(pullRequests.length / PAGE_SIZE));
  const requestedPage = pagination.username === username ? pagination.page : 1;
  const currentPage = Math.min(requestedPage, pageCount);
  const visiblePullRequests = pullRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const stats = [
    { label: "PRs Opened", value: developer.prsOpenedCount ?? 0 },
    { label: "PRs Reviewed", value: developer.prsReviewedCount ?? 0 },
    { label: "Total Commits", value: developer.commitsCount ?? 0 },
    {
      label: "Repositories Contributed",
      value: developer.activeRepos?.length ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Dashboard
        </Link>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={developer.avatarUrl || "https://github.com/ghost.png"}
              alt={`${developer.developerUsername} avatar`}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
            />
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                @{developer.developerUsername}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <ClockCountdown size={15} aria-hidden="true" />
                {formatLastActive(developer.lastActiveAt)}
              </p>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black"
              >
                <dd className="text-xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <FolderSimple
              size={19}
              weight="duotone"
              className="text-zinc-600 dark:text-zinc-300"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold">Active Repositories</h2>
            <span className="text-xs text-zinc-500">
              {developer.activeRepos?.length ?? 0}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {developer.activeRepos?.length ? (
              developer.activeRepos.map((repo) => (
                <a
                  key={repo}
                  href={`https://github.com/standard/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
                >
                  <FolderSimple size={15} aria-hidden="true" />
                  <span className="break-all">{repo}</span>
                  <ArrowSquareOut
                    size={13}
                    className="shrink-0 text-zinc-400"
                    aria-hidden="true"
                  />
                </a>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No active repositories recorded.
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <GitPullRequest
              size={19}
              weight="duotone"
              className="text-zinc-600 dark:text-zinc-300"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold">Pull Requests Authored</h2>
            <span className="text-xs text-zinc-500">{pullRequests.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3">PR Number</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Repository</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Stuck</th>
                  <th className="px-5 py-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
                {pullRequests.length ? (
                  visiblePullRequests.map((pullRequest) => {
                    const state = pullRequestState(pullRequest.state);
                    const StateIcon = state.Icon;

                    return (
                      <tr
                        key={pullRequest._id}
                        className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium">
                          #{pullRequest.prNumber}
                        </td>
                        <td className="max-w-md px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                          <span className="line-clamp-2">
                            {pullRequest.title}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {pullRequest.repository?.name ||
                            pullRequest.repository?.fullName ||
                            "Unknown repository"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${state.className}`}
                          >
                            <StateIcon
                              size={13}
                              weight="bold"
                              aria-hidden="true"
                            />
                            {state.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {pullRequest.isStuck ? (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                              <ClockCountdown size={13} aria-hidden="true" />
                              Stuck
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">No</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {pullRequest.htmlUrl ? (
                            <a
                              href={pullRequest.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                            >
                              View
                              <ArrowSquareOut size={13} aria-hidden="true" />
                            </a>
                          ) : (
                            <span className="text-zinc-400">Unavailable</span>
                          )}
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
                      No authored pull requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalCount={pullRequests.length}
            onPageChange={(nextPage) =>
              setPagination({
                page: Math.min(Math.max(nextPage, 1), pageCount),
                username,
              })
            }
          />
        </section>
      </div>
    </main>
  );
}

export default function DeveloperProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <DeveloperProfileContent />
    </Suspense>
  );
}
