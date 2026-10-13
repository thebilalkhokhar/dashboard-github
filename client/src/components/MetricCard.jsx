import React from "react";

export default function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass = "bg-slate-500/10 text-slate-400",
  subtitle,
}) {
  const displayValue = value ?? 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            {title}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {displayValue}
            </span>
            {subtitle ? (
              <span className="pb-1 text-[11px] text-slate-400">{subtitle}</span>
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
