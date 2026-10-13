import React from "react";

export default function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass = "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  subtitle,
}) {
  const displayValue = value ?? 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              {displayValue}
            </span>
            {subtitle ? (
              <span className="pb-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorClass}`}
        >
          {Icon ? <Icon size={22} weight="fill" /> : null}
        </div>
      </div>
    </div>
  );
}
