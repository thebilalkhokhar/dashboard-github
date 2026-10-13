"use client";
import React from "react";
import Image from "next/image";
import {
  ArrowSquareOut,
  CheckCircle,
  ClockCountdown,
  FolderSimple,
  MagnifyingGlass,
  XCircle,
} from "@phosphor-icons/react";

const formatDate = (value) => {
  if (!value) return "No push data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toISOString().slice(0, 10);
};

function HealthCheck({ label, passed }) {
  const Icon = passed ? CheckCircle : XCircle;

  return (
    <span
      title={`${label}: ${passed ? "available" : "not detected"}`}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] ${
        passed
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
      }`}
    >
      <Icon size={12} weight="bold" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function RepositoryTable({
  repositories = [],
  loading,
  searchQuery = "",
  inactiveOnly = false,
  allCount = 0,
  inactiveCount = 0,
  onFilterChange,
}) {
  const [sortBy, setSortBy] = React.useState("lastPushedAt");

  if (loading) {
    return (
      <section className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="mb-5 h-6 w-44 rounded bg-zinc-200 dark:bg-zinc-900" />
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-12 rounded bg-zinc-100 dark:bg-zinc-900/60"
            />
          ))}
        </div>
      </section>
    );
  }

  const filterButtonClass = (selected) =>
    `rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
      selected
        ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
    }`;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleRepositories = repositories
    .filter(
      (repo) =>
        repo.name?.toLocaleLowerCase().includes(normalizedQuery) ||
        repo.fullName?.toLocaleLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => {
      if (sortBy === "openPrsCount") {
        return (Number(b.openPrsCount) || 0) - (Number(a.openPrsCount) || 0);
      }

      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }

      const dateA = a.lastPushedAt ? new Date(a.lastPushedAt).getTime() : 0;
      const dateB = b.lastPushedAt ? new Date(b.lastPushedAt).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FolderSimple
            size={20}
            weight="duotone"
            className="text-zinc-600 dark:text-zinc-300"
          />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Repositories
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/60"
            aria-label="Filter repositories"
          >
            <button
              type="button"
              aria-pressed={!inactiveOnly}
              onClick={() => onFilterChange?.(false)}
              className={filterButtonClass(!inactiveOnly)}
            >
              All Repositories
              <span className="ml-1.5 opacity-70">{allCount}</span>
            </button>
            <button
              type="button"
              aria-pressed={inactiveOnly}
              onClick={() => onFilterChange?.(true)}
              className={filterButtonClass(inactiveOnly)}
            >
              Inactive Only
              <span className="ml-1.5 opacity-70">{inactiveCount}</span>
            </button>
          </div>
          <label htmlFor="repository-sort" className="sr-only">
            Sort repositories
          </label>
          <select
            id="repository-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="lastPushedAt">Recently Pushed</option>
            <option value="openPrsCount">Most Open PRs</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Repository</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Top Contributor</th>
              <th className="px-4 py-3 text-center">Open PRs</th>
              <th className="px-4 py-3">Health Checks</th>
              <th className="px-4 py-3">Last Pushed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
            {visibleRepositories.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  {normalizedQuery ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <MagnifyingGlass size={15} aria-hidden="true" />
                      No matching results found for &apos;{searchQuery}&apos;
                    </span>
                  ) : inactiveOnly
                    ? "No inactive repositories found."
                    : "No repositories found. Sync GitHub data to get started."}
                </td>
              </tr>
            ) : (
              visibleRepositories.map((repo) => {
                const topContributor = repo.topContributor?.username
                  ? repo.topContributor
                  : null;
                const fullName = repo.fullName || repo.name;

                return (
                  <tr
                    key={repo._id || repo.githubRepoId || fullName}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3.5">
                      <a
                        href={`https://github.com/${fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex max-w-[220px] items-center gap-1.5"
                      >
                        <span className="truncate font-medium text-zinc-900 group-hover:underline dark:text-white">
                          {repo.name}
                        </span>
                        <ArrowSquareOut
                          size={12}
                          className="shrink-0 text-zinc-400"
                          aria-hidden="true"
                        />
                      </a>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {fullName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {repo.isInactive ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <ClockCountdown size={12} weight="bold" />
                          &gt;90d idle
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {topContributor ? (
                        <div className="flex items-center gap-2">
                          {topContributor.avatarUrl ? (
                            <Image
                              src={topContributor.avatarUrl}
                              alt=""
                              width={24}
                              height={24}
                              unoptimized
                              className="h-6 w-6 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <span className="block max-w-[140px] truncate font-medium text-zinc-800 dark:text-zinc-200">
                              @{topContributor.username}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {topContributor.commitsCount ?? 0} commits
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {repo.openPrsCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        <HealthCheck
                          label="README"
                          passed={Boolean(repo.healthChecks?.hasReadme)}
                        />
                        <HealthCheck
                          label="License"
                          passed={Boolean(repo.healthChecks?.hasLicense)}
                        />
                        <HealthCheck
                          label="CI"
                          passed={Boolean(repo.healthChecks?.hasCi)}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {formatDate(repo.lastPushedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
