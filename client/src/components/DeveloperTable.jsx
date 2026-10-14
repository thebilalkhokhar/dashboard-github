"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MagnifyingGlass,
  Users,
  GitPullRequest,
  GitMerge,
} from "@phosphor-icons/react";

const sortOptions = [
  { value: "prsOpenedCount", label: "Most PRs Opened" },
  { value: "prsReviewedCount", label: "Most PRs Reviewed" },
  { value: "commitsCount", label: "Most Commits" },
];

export default function DeveloperTable({
  developers = [],
  loading,
  searchQuery = "",
}) {
  const [sortBy, setSortBy] = React.useState("prsOpenedCount");

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 animate-pulse dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="mb-4 h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-900" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded bg-zinc-100 dark:bg-zinc-900/60"
            />
          ))}
        </div>
      </div>
    );
  }

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleDevelopers = developers
    .filter((developer) =>
      developer.developerUsername
        ?.toLocaleLowerCase()
        .includes(normalizedQuery),
    )
    .sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0));

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Users
            size={20}
            weight="duotone"
            className="text-zinc-600 dark:text-zinc-300"
          />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Developer Activity & Workload
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="developer-sort" className="sr-only">
            Sort developers
          </label>
          <select
            id="developer-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            {visibleDevelopers.length} contributors
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="py-3 px-5">Developer</th>
              <th className="py-3 px-5 text-center">PRs Opened</th>
              <th className="py-3 px-5 text-center">PRs Reviewed</th>
              <th className="py-3 px-5 text-center">Commits</th>
              <th className="py-3 px-5">Active Repos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
            {visibleDevelopers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-zinc-500 dark:text-zinc-500"
                >
                  {normalizedQuery ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <MagnifyingGlass size={15} aria-hidden="true" />
                      No matching results found for &apos;{searchQuery}&apos;
                    </span>
                  ) : (
                    "No developer activity found."
                  )}
                </td>
              </tr>
            ) : (
              visibleDevelopers.map((dev) => (
                <tr
                  key={dev._id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <td className="py-3.5 px-5">
                    <Link
                      href={`/developers/${dev.developerUsername}`}
                      className="flex w-fit items-center gap-3 transition-colors hover:text-black dark:hover:text-white"
                    >
                      <Image
                        src={dev.avatarUrl || "https://github.com/ghost.png"}
                        alt={dev.developerUsername}
                        width={28}
                        height={28}
                        unoptimized
                        className="h-7 w-7 rounded-full border border-zinc-200 object-cover dark:border-zinc-800"
                      />
                      <span className="font-medium text-zinc-900 hover:underline dark:text-white">
                        @{dev.developerUsername}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <GitPullRequest size={13} weight="bold" />
                      {dev.prsOpenedCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      <GitMerge size={13} weight="bold" />
                      {dev.prsReviewedCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center font-medium tabular-nums">
                    {dev.commitsCount ?? 0}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex max-w-xs flex-wrap gap-1 xl:max-w-md">
                      {dev.activeRepos?.map((repo) => (
                        <span
                          key={repo}
                          className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {repo}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
