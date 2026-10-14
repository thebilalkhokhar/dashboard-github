"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

function getPageItems(page, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b);

  return pages.flatMap((number, index) => {
    const previous = pages[index - 1];
    return previous && number - previous > 1
      ? ["ellipsis", number]
      : [number];
  });
}

export default function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisible = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalCount);
  const pageItems = getPageItems(page, pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Showing {firstVisible} to {lastVisible} of {totalCount}
      </span>
      <nav
        aria-label="Table pagination"
        className="flex items-center gap-1.5"
      >
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <CaretLeft size={14} aria-hidden="true" />
          Previous
        </button>
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={page === item ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`min-w-8 rounded border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                page === item
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Next
          <CaretRight size={14} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
