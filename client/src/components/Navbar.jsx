"use client";
import { useEffect, useState } from "react";
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Clock,
  FolderSimple,
  GitPullRequest,
  MagnifyingGlass,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { fetchSyncStatus, triggerSync } from "@/lib/api";

export default function Navbar({
  onSyncComplete,
  searchQuery,
  onSearchChange,
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let isActive = true;
    const loadLastSync = async () => {
      try {
        const status = await fetchSyncStatus();
        if (isActive) {
          setSyncStatus(status);
          if (status.status === "completed") {
            setLastSyncedAt(status.updatedAt || status.startedAt);
          }
        }
      } catch (error) {
        console.error("Unable to load the last sync status:", error);
        if (isActive) setStatusError("Last sync time is unavailable.");
      }
    };
    void loadLastSync();

    return () => {
      isActive = false;
    };
  }, []);

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
        updatedAt: new Date().toISOString(),
      }));
      setLastSyncedAt(new Date().toISOString());
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
  const lastSyncedLabel =
    lastSyncedAt && !Number.isNaN(new Date(lastSyncedAt).getTime())
    ? `Last synced ${new Date(lastSyncedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })}`
    : lastSyncedAt
      ? "Last sync time unavailable"
      : "No successful sync recorded";

  return (
    <>
      <header className="ml-0 flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:pr-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Dashboard <span className="mx-1.5 text-zinc-400">/</span> Telemetry
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {statusError || lastSyncedLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="relative w-32 sm:w-48 lg:w-64">
            <MagnifyingGlass
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search dashboard"
              aria-label="Search developers and repositories"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </label>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            aria-label={syncing ? "Syncing GitHub data" : "Sync Data"}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <ArrowsClockwise
              size={16}
              weight="bold"
              className={syncing ? "animate-spin" : ""}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {syncing ? "Syncing..." : "Sync Data"}
            </span>
          </button>
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
