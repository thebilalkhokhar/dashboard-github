"use client";
import React from "react";
import Image from "next/image";
import { Users, GitPullRequest, GitMerge } from "@phosphor-icons/react";

export default function DeveloperTable({ developers = [], loading }) {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-slate-800 w-48 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
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
          <Users size={20} weight="duotone" className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">
            Developer Activity & Workload
          </h2>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
          {developers.length} contributors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-5">Developer</th>
              <th className="py-3 px-5 text-center">PRs Opened</th>
              <th className="py-3 px-5 text-center">PRs Reviewed</th>
              <th className="py-3 px-5">Active Repos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {developers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  No developer activity found.
                </td>
              </tr>
            ) : (
              developers.map((dev) => (
                <tr
                  key={dev._id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <Image
                        src={dev.avatarUrl || "https://github.com/ghost.png"}
                        alt={dev.developerUsername}
                        width={28}
                        height={28}
                        unoptimized
                        className="h-7 w-7 rounded-full border border-slate-700 object-cover"
                      />
                      <span className="font-medium text-white">
                        @{dev.developerUsername}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <GitPullRequest size={13} weight="bold" />
                      {dev.prsOpenedCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      <GitMerge size={13} weight="bold" />
                      {dev.prsReviewedCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {dev.activeRepos?.map((repo) => (
                        <span
                          key={repo}
                          className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
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
