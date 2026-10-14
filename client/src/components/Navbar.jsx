"use client";
import React, { useState, useSyncExternalStore } from "react";
import {
  ArrowsClockwise,
  GitBranch,
  Moon,
  Sun,
} from "@phosphor-icons/react";
import { triggerSync } from "@/lib/api";

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
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDarkMode = theme === "dark";

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;
    document.documentElement.classList.toggle("dark", nextIsDarkMode);
    window.localStorage.setItem("theme", nextIsDarkMode ? "dark" : "light");
    window.dispatchEvent(new Event(themeChangeEvent));
  };

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
  );
}
