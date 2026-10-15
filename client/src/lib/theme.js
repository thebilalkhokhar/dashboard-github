"use client";

import { useSyncExternalStore } from "react";

export const themeChangeEvent = "dashboard-theme-change";

const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const preference = window.localStorage.getItem("theme");
  return ["system", "light", "dark"].includes(preference) ? preference : "system";
};

const getServerTheme = () => "system";

export const applyThemePreference = (preference) => {
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
};

export const setThemePreference = (preference) => {
  window.localStorage.setItem("theme", preference);
  applyThemePreference(preference);
  window.dispatchEvent(new Event(themeChangeEvent));
};

export const useThemePreference = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      const handleChange = () => {
        applyThemePreference(getStoredTheme());
        onStoreChange();
      };
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      window.addEventListener(themeChangeEvent, handleChange);
      window.addEventListener("storage", handleChange);
      mediaQuery.addEventListener("change", handleChange);

      return () => {
        window.removeEventListener(themeChangeEvent, handleChange);
        window.removeEventListener("storage", handleChange);
        mediaQuery.removeEventListener("change", handleChange);
      };
    },
    getStoredTheme,
    getServerTheme,
  );
