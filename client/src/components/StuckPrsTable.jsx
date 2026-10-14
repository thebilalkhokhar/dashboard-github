"use client";
import React from "react";
import { WarningCircle, ArrowSquareOut } from "@phosphor-icons/react";
import TablePagination from "@/components/TablePagination";

const PAGE_SIZE = 10;

export default function StuckPrsTable({
  prs = [],
  loading,
  searchQuery = "",
}) {
  const [pagination, setPagination] = React.useState({ page: 1, searchQuery });
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const filteredPrs = React.useMemo(
    () =>
      prs.filter((pr) => {
        if (!normalizedQuery) return true;

        const author =
          pr.authorGithubId ||
          pr.author?.username ||
          pr.author?.login ||
          pr.author ||
          "";
        const searchableFields = [
          pr.title,
          pr.prNumber,
          author,
          pr.repository?.name,
          pr.repository?.fullName,
        ];

        return searchableFields.some((field) =>
          String(field ?? "")
            .toLocaleLowerCase()
            .includes(normalizedQuery),
        );
      }),
    [normalizedQuery, prs],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPrs.length / PAGE_SIZE));
  const currentPage =
    pagination.searchQuery === searchQuery
      ? Math.min(pagination.page, pageCount)
      : 1;
  const pagePrs = React.useMemo(
    () =>
      filteredPrs.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredPrs],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 animate-pulse dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="mb-4 h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-900" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-zinc-100 dark:bg-zinc-900/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <WarningCircle
            size={20}
            weight="duotone"
            className="text-amber-500 dark:text-amber-400"
          />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Stuck Pull Requests
          </h2>
        </div>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          {filteredPrs.length} blocked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <tr>
              <th className="py-3 px-5">Title</th>
              <th className="py-3 px-5">Repository</th>
              <th className="py-3 px-5">Author</th>
              <th className="py-3 px-5 text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800/60 dark:text-zinc-300">
            {filteredPrs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-500">
                  {normalizedQuery
                    ? `No stuck pull requests found matching "${searchQuery}"`
                    : "No stuck pull requests. All good!"}
                </td>
              </tr>
            ) : (
              pagePrs.map((pr) => {
                const repoFullName =
                  pr.repository?.fullName ||
                  `standard/${pr.repository?.name}`;
                const link =
                  pr.htmlUrl ||
                  `https://github.com/${repoFullName}/pull/${pr.prNumber}`;
                const author =
                  pr.authorGithubId ||
                  pr.author?.username ||
                  pr.author?.login ||
                  pr.author ||
                  "unknown";

                return (
                  <tr
                    key={pr._id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td
                      title={`#${pr.prNumber} ${pr.title}`}
                      className="max-w-[200px] truncate py-3.5 px-5 font-medium text-zinc-900 sm:max-w-[280px] dark:text-white"
                    >
                      #{pr.prNumber} {pr.title}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-500 dark:text-zinc-400">
                      {pr.repository?.name || "Unknown"}
                    </td>
                    <td className="py-3.5 px-5">@{author}</td>
                    <td className="py-3.5 px-5 text-right">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 whitespace-nowrap text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
                      >
                        View
                        <ArrowSquareOut size={13} />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalCount={filteredPrs.length}
        onPageChange={(nextPage) =>
          setPagination({
            page: Math.min(Math.max(nextPage, 1), pageCount),
            searchQuery,
          })
        }
      />
    </div>
  );
}
