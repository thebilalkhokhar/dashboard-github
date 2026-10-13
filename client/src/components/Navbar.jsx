"use client";
import React, { useState } from "react";
import { ArrowsClockwise, GitBranch } from "@phosphor-icons/react";
import { triggerSync } from "@/lib/api";

export default function Navbar({ onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await triggerSync();
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error("Sync failed:", err);
      alert("Sync failed. Check backend console.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GitBranch size={20} weight="bold" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              GitHub Analytics
            </h1>
            <p className="text-xs text-slate-400">
              Team health & activity monitor
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <ArrowsClockwise
            size={16}
            weight="bold"
            className={syncing ? "animate-spin" : ""}
          />
          {syncing ? "Syncing GitHub..." : "Sync Data"}
        </button>
      </div>
    </header>
  );
}
