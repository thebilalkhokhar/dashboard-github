"use client";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Clock,
  FolderSimple,
  GitBranch,
  GitPullRequest,
  Moon,
  Sun,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { fetchSyncStatus, triggerSync } from "@/lib/api";

const themeChangeEvent = "dashboard-theme-change";

const getThemeSnapshot = () =>
  window.localStorage.getItem("theme") === "dark" ? "dark" : "light";

const getServerThemeSnapshot = () => "light";

const subscribeToTheme = (onStoreChange) => {
  const handleThemeChange = () => {
    document.documentElement.classList.toggle(
      "dark",
      getThemeSnapshot() === "dark",
    );
    onStoreChange();
  };

  window.addEventListener(themeChangeEvent, handleThemeChange);
  window.addEventListener("storage", handleThemeChange);

  return () => {
    window.removeEventListener(themeChangeEvent, handleThemeChange);
    window.removeEventListener("storage", handleThemeChange);
  };
};

export default function Navbar({ onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDarkMode = theme === "dark";

  useEffect(() => {
    if (!syncing) return undefined;

    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timerId = window.setInterval(updateTime, 1000);

    let isActive = true;
    const updateStatus = async () => {
      try {
        const status = await fetchSyncStatus();
        if (isActive) {
          setSyncStatus((currentStatus) =>
            currentStatus?.status === "completed" ||
            currentStatus?.status === "failed"
              ? currentStatus
              : status,
          );
          setStatusError("");
        }
      } catch (error) {
        console.error("Failed to fetch sync progress:", error);
        if (isActive) {
          setStatusError("Live progress is temporarily unavailable.");
        }
      }
    };

    void updateStatus();
    const intervalId = window.setInterval(() => {
      void updateStatus();
    }, 1200);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.clearInterval(timerId);
    };
  }, [syncing]);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;
    document.documentElement.classList.toggle("dark", nextIsDarkMode);
    window.localStorage.setItem("theme", nextIsDarkMode ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncModalOpen(true);
      setCurrentTime(Date.now());
      setSyncError("");
      setStatusError("");
      setSyncStatus({
        status: "running",
        phase: "starting",
        completedRepositories: 0,
        totalRepositories: 0,
        syncedPullRequests: 0,
        currentRepository: null,
        startedAt: new Date().toISOString(),
      });
      const response = await triggerSync();
      const result = response.data;
      setSyncStatus((currentStatus) => ({
        ...currentStatus,
        status: "completed",
        phase: "completed",
        completedRepositories: result.syncedReposCount,
        totalRepositories: result.syncedReposCount,
        syncedPullRequests: result.syncedPrsCount,
        currentRepository: null,
      }));
      if (onSyncComplete) await onSyncComplete();
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus((currentStatus) => ({
        ...currentStatus,
        status: "failed",
        phase: "failed",
        currentRepository: null,
      }));
      setSyncError(
        err.response?.data?.message || err.message || "Sync operation failed.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const phase = syncStatus?.phase;
  const completedRepositories = syncStatus?.completedRepositories || 0;
  const totalRepositories = syncStatus?.totalRepositories || 0;
  const isComplete = syncStatus?.status === "completed" && !syncError;
  const isFailed = syncStatus?.status === "failed" || Boolean(syncError);
  const isIndeterminate = phase === "starting" || phase === "fetching-repositories";
  const progress = isComplete
    ? 100
    : phase === "saving-repositories"
      ? totalRepositories
        ? Math.round((completedRepositories / totalRepositories) * 50)
        : 0
      : phase === "syncing-pull-requests"
        ? 50 +
          (totalRepositories
            ? Math.round((completedRepositories / totalRepositories) * 50)
            : 0)
        : 0;
  const phaseLabel = {
    starting: "Starting GitHub sync",
    "fetching-repositories": "Fetching your repositories",
    "saving-repositories": "Saving repository details",
    "syncing-pull-requests": "Syncing pull requests",
    completed: "Sync completed",
    failed: "Sync interrupted",
  }[phase] || "Preparing to sync";
  const elapsedSeconds = syncStatus?.startedAt
    ? Math.max(
        0,
        Math.floor(
          (currentTime - new Date(syncStatus.startedAt).getTime()) / 1000,
        ),
      )
    : 0;
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}m ${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}s`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-900 flex items-center justify-center dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
              <GitBranch size={20} weight="bold" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                GitHub Analytics
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Team health & activity monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isDarkMode ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <ArrowsClockwise
                size={16}
                weight="bold"
                className={syncing ? "animate-spin" : ""}
              />
              {syncing ? "Syncing GitHub..." : "Sync Data"}
            </button>
          </div>
        </div>
      </header>

      {syncModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !syncing) {
              setSyncModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sync-modal-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between border-b border-zinc-200 p-5 dark:border-zinc-800 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isComplete
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isFailed
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                }`}>
                  {isComplete ? (
                    <CheckCircle size={23} weight="duotone" />
                  ) : isFailed ? (
                    <WarningCircle size={23} weight="duotone" />
                  ) : (
                    <CircleNotch size={23} className="animate-spin" />
                  )}
                </div>
                <div>
                  <h2 id="sync-modal-title" className="text-base font-semibold text-zinc-900 dark:text-white">
                    {isComplete ? "Sync complete" : isFailed ? "Sync needs attention" : "Syncing GitHub data"}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {isComplete
                      ? "Your dashboard data is up to date."
                      : isFailed
                        ? "The sync could not finish."
                        : "This may take a while for larger organizations."}
                  </p>
                </div>
              </div>
              {!syncing && (
                <button
                  type="button"
                  aria-label="Close sync details"
                  onClick={() => setSyncModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{phaseLabel}</p>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {isIndeterminate ? "Working..." : `${progress}%`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="GitHub sync progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={isIndeterminate ? undefined : progress}
                  className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
                >
                  <div
                    className={`h-full rounded-full bg-zinc-900 transition-all duration-500 dark:bg-white ${
                      isIndeterminate ? "w-1/3 animate-pulse" : ""
                    }`}
                    style={isIndeterminate ? undefined : { width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <FolderSimple size={16} />
                    <span className="text-xs">Repositories</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">
                    {totalRepositories
                      ? `${completedRepositories} / ${totalRepositories}`
                      : "--"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <GitPullRequest size={16} />
                    <span className="text-xs">PRs synced this run</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">
                    {syncStatus?.syncedPullRequests || 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-zinc-900/50">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {phase === "saving-repositories" ? "Saving repository" : "Current repository"}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {syncStatus?.currentRepository || (phase === "fetching-repositories" ? "Loading repository list..." : "Preparing...")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock size={14} />
                  {elapsedLabel}
                </div>
              </div>

              {(syncError || syncStatus?.error) && (
                <p role="alert" className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-300">
                  {syncError || syncStatus.error}
                </p>
              )}
              {statusError && syncing && (
                <p className="text-xs text-amber-700 dark:text-amber-300">{statusError}</p>
              )}
              {isComplete && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  This run synced {completedRepositories} repositories and {syncStatus?.syncedPullRequests || 0} pull requests. Dashboard totals include previously stored pull requests.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
