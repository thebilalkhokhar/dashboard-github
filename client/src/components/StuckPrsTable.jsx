"use client";
import React from "react";
import { WarningCircle, ArrowSquareOut } from "@phosphor-icons/react";

export default function StuckPrsTable({ prs = [], loading }) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-slate-800 w-48 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WarningCircle
            size={20}
            weight="duotone"
            className="text-amber-400"
          />
          <h2 className="text-sm font-semibold text-white">
            Stuck Pull Requests
          </h2>
        </div>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
          {prs.length} blocked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-5">Title</th>
              <th className="py-3 px-5">Repository</th>
              <th className="py-3 px-5">Author</th>
              <th className="py-3 px-5 text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {prs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No stuck pull requests. All good!
                </td>
              </tr>
            ) : (
              prs.map((pr) => (
                <tr
                  key={pr._id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium text-white max-w-xs truncate">
                    #{pr.prNumber} {pr.title}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">
                    {pr.repository?.name || "Unknown"}
                  </td>
                  <td className="py-3.5 px-5">@{pr.author?.username}</td>
                  <td className="py-3.5 px-5 text-right">
                    <a
                      href={pr.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      View
                      <ArrowSquareOut size={13} />
                    </a>
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
