"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CircleNotch,
  FloppyDisk,
  Moon,
  PaperPlaneTilt,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import {
  getPushSubscriptionStatus,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/lib/pushManager";

const defaultSettings = {
  browserPushEnabled: false,
  inactiveRepoDays: 3,
  stuckPrHours: 24,
  inactiveRepoAlerts: true,
  stuckPrAlerts: true,
  syncAlerts: true,
};

const tabs = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: User },
];

const permissionLabel = {
  granted: "Granted",
  default: "Not requested",
  denied: "Denied",
};

const inputClass =
  "min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-600";

function Toggle({ checked, disabled, label, description, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-500 ${
          checked
            ? "bg-zinc-900 after:translate-x-4 dark:bg-zinc-100 dark:after:bg-zinc-900"
            : "bg-zinc-300 dark:bg-zinc-700"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      />
    </label>
  );
}

function ThresholdInput({ label, value, unit, min, max, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      <span className="flex items-center rounded-lg border border-zinc-200 bg-white focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
        <input
          type="number"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 text-sm text-zinc-900 outline-none dark:text-zinc-100"
          aria-label={label}
        />
        <span className="mr-2 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          {unit}
        </span>
      </span>
      <span className="mt-1.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
        {min}–{max} {unit}
      </span>
    </label>
  );
}

export default function SettingsModal({ isOpen, onClose, user }) {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const theme = useThemePreference();

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus?.();
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frameId = window.requestAnimationFrame(() =>
      closeButtonRef.current?.focus(),
    );

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || activeTab !== "notifications") return undefined;
    let isActive = true;

    const loadSettings = async () => {
      setLoading(true);
      setError("");
      setFeedback("");
      try {
        const [settingsResponse, pushStatus] = await Promise.all([
          api.get("/notifications/settings"),
          getPushSubscriptionStatus(),
        ]);
        if (!isActive) return;

        const saved = settingsResponse.data?.data || {};
        setPermission(pushStatus.permission);
        setSettings({
          ...defaultSettings,
          ...saved,
          browserPushEnabled:
            Boolean(saved.browserPushEnabled) && pushStatus.subscribed,
        });
        setDirty(false);
        if (saved.browserPushEnabled && !pushStatus.subscribed) {
          setFeedback(
            "Push is enabled in your account, but this browser has no active subscription. Turn it on to reconnect.",
          );
        }
      } catch (loadError) {
        console.error("Unable to load notification preferences:", loadError);
        if (isActive) {
          setError(
            loadError.response?.data?.message ||
              "Notification preferences could not be loaded.",
          );
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadSettings();
    return () => {
      isActive = false;
    };
  }, [activeTab, isOpen]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setFeedback("");
    setError("");
  };

  const handlePushChange = async (enabled) => {
    setPushBusy(true);
    setError("");
    setFeedback("");
    try {
      if (enabled) {
        const result = await subscribeUserToPush();
        const status = await getPushSubscriptionStatus();
        setPermission(status.permission);
        if (!result.success) {
          setFeedback(
            result.reason === "permission_denied"
              ? "Browser permission is denied. Allow notifications for this site in your browser settings, then try again."
              : result.reason === "unsupported"
                ? "This browser does not support push notifications."
                : "Push notifications could not be enabled. Please try again.",
          );
          return;
        }
        updateSetting("browserPushEnabled", true);
        setFeedback(
          "Browser desktop push is ready. Save preferences to apply it to your account.",
        );
      } else {
        const result = await unsubscribeUserFromPush();
        if (!result.success) {
          setFeedback("This browser could not unsubscribe from push notifications.");
          return;
        }
        updateSetting("browserPushEnabled", false);
        setFeedback(
          "Browser desktop push is off. Save preferences to apply the change.",
        );
      }
    } catch (pushError) {
      console.error("Unable to update browser push subscription:", pushError);
      setError(
        pushError.response?.data?.message ||
          "Browser push settings could not be updated.",
      );
    } finally {
      setPushBusy(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setFeedback("");

    const inactiveRepoDays = Number(settings.inactiveRepoDays);
    const stuckPrHours = Number(settings.stuckPrHours);
    if (
      !Number.isInteger(inactiveRepoDays) ||
      inactiveRepoDays < 1 ||
      inactiveRepoDays > 365 ||
      !Number.isInteger(stuckPrHours) ||
      stuckPrHours < 1 ||
      stuckPrHours > 720
    ) {
      setError("Enter whole numbers within the displayed threshold ranges.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put("/notifications/settings", {
        browserPushEnabled: settings.browserPushEnabled,
        inactiveRepoAlerts: settings.inactiveRepoAlerts,
        stuckPrAlerts: settings.stuckPrAlerts,
        syncAlerts: settings.syncAlerts,
        inactiveRepoDays,
        stuckPrHours,
      });
      setSettings((current) => ({
        ...current,
        ...(response.data?.data || {}),
      }));
      setDirty(false);
      setFeedback("Preferences saved.");
    } catch (saveError) {
      console.error("Unable to save notification preferences:", saveError);
      setError(
        saveError.response?.data?.message ||
          "Notification preferences could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setFeedback("");
    try {
      await api.post("/notifications/test-push");
      setFeedback("Test alert dispatched to your desktop!");
    } catch (testError) {
      console.error("Unable to send test notification:", testError);
      setError(
        testError.response?.data?.message ||
          "The test notification could not be sent.",
      );
    } finally {
      setTesting(false);
    }
  };

  const displayName = user?.name || user?.email || "Signed-in user";

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        className={`relative z-10 flex h-[min(720px,calc(100vh-2rem))] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl transition-[opacity,transform] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 ${
          isOpen ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <nav
          aria-label="Settings sections"
          className="w-12 shrink-0 space-y-1 border-r border-zinc-200 bg-zinc-50/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50 sm:w-52 sm:p-3"
        >
          <h2
            id="settings-modal-title"
            className="mb-4 hidden px-2 pt-1 text-sm font-semibold tracking-tight sm:block"
          >
            Settings
          </h2>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-label={label}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex w-full items-center justify-center gap-2.5 rounded-lg px-1 py-2 text-left text-sm transition-colors sm:justify-start sm:px-2.5 ${
                activeTab === id
                  ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-white/70 dark:text-zinc-400 dark:hover:bg-zinc-800/70"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800 sm:px-6">
            <div>
              <h3 className="text-sm font-semibold">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {activeTab === "general"
                  ? "Customize how the dashboard looks."
                  : activeTab === "notifications"
                    ? "Manage browser alerts and telemetry thresholds."
                    : "Your signed-in profile and session."}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close settings"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {activeTab === "general" && (
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <section aria-labelledby="appearance-title">
                <h4 id="appearance-title" className="text-sm font-medium">
                  Appearance
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Choose your preferred color theme.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "system", label: "System", Icon: SlidersHorizontal },
                    { id: "light", label: "Light", Icon: Sun },
                    { id: "dark", label: "Dark", Icon: Moon },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setThemePreference(id)}
                      aria-pressed={theme === id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors ${
                        theme === id
                          ? "border-zinc-500 bg-zinc-100 font-medium dark:border-zinc-500 dark:bg-zinc-900"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <Icon size={17} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "account" && (
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <section aria-labelledby="account-details-title">
                <h4 id="account-details-title" className="text-sm font-medium">
                  Account details
                </h4>
                <dl className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 px-4 dark:divide-zinc-800 dark:border-zinc-800">
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                      Name
                    </dt>
                    <dd className="text-right text-sm font-medium">{displayName}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                      Email
                    </dt>
                    <dd className="text-right text-sm font-medium">
                      {user?.email || "Not available"}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                      Session
                    </dt>
                    <dd className="text-right text-sm font-medium">
                      Active browser session
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 py-3">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                      Storage
                    </dt>
                    <dd className="text-right text-sm font-medium">
                      Session-only
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <CircleNotch
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Loading preferences…
                  </div>
                ) : (
                  <>
                    <section aria-labelledby="delivery-title">
                      <h4 id="delivery-title" className="text-sm font-medium">
                        Browser push
                      </h4>
                      <div className="mt-2 rounded-xl border border-zinc-200 px-3 dark:border-zinc-800">
                        <Toggle
                          checked={settings.browserPushEnabled}
                          disabled={pushBusy || saving}
                          label="Enable browser notifications"
                          description="Receive alerts in this browser, even when the dashboard is closed."
                          onChange={(event) =>
                            void handlePushChange(event.target.checked)
                          }
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Browser permission
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                          {permissionLabel[permission] || "Not requested"}
                        </span>
                      </div>
                      {permission === "denied" && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          Notifications are blocked by your browser. Change this
                          site’s notification permission in browser settings before
                          enabling push.
                        </p>
                      )}
                    </section>

                    <section aria-labelledby="threshold-title">
                      <h4
                        id="threshold-title"
                        className="mb-3 text-sm font-medium"
                      >
                        Alert thresholds
                      </h4>
                      <div className="space-y-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <ThresholdInput
                          label="Inactive repository threshold"
                          value={settings.inactiveRepoDays}
                          unit="days"
                          min={1}
                          max={365}
                          onChange={(event) =>
                            updateSetting("inactiveRepoDays", event.target.value)
                          }
                        />
                        <ThresholdInput
                          label="Stuck pull request threshold"
                          value={settings.stuckPrHours}
                          unit="hours"
                          min={1}
                          max={720}
                          onChange={(event) =>
                            updateSetting("stuckPrHours", event.target.value)
                          }
                        />
                      </div>
                    </section>

                    <section aria-labelledby="events-title">
                      <h4 id="events-title" className="text-sm font-medium">
                        Event alerts
                      </h4>
                      <div className="mt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                        <Toggle
                          checked={settings.inactiveRepoAlerts}
                          disabled={saving}
                          label="Inactive repositories"
                          description="Alert when a repository has no commits past the threshold."
                          onChange={(event) =>
                            updateSetting(
                              "inactiveRepoAlerts",
                              event.target.checked,
                            )
                          }
                        />
                        <Toggle
                          checked={settings.stuckPrAlerts}
                          disabled={saving}
                          label="Stuck pull requests"
                          description="Alert on open PRs with no activity or pending reviews."
                          onChange={(event) =>
                            updateSetting("stuckPrAlerts", event.target.checked)
                          }
                        />
                        <Toggle
                          checked={settings.syncAlerts}
                          disabled={saving}
                          label="Sync alerts"
                          description="Alert on GitHub synchronization errors or rate limits."
                          onChange={(event) =>
                            updateSetting("syncAlerts", event.target.checked)
                          }
                        />
                      </div>
                    </section>
                  </>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    {error}
                  </p>
                )}
                {feedback && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {feedback}
                  </p>
                )}
              </div>

              <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6">
                <button
                  type="button"
                  onClick={() => void handleTest()}
                  disabled={
                    loading ||
                    testing ||
                    saving ||
                    dirty ||
                    !settings.browserPushEnabled
                  }
                  className={`${inputClass} inline-flex items-center justify-center gap-2 px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {testing ? (
                    <CircleNotch
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <PaperPlaneTilt size={16} aria-hidden="true" />
                  )}
                  {testing ? "Sending…" : "Send Test Push"}
                </button>
                <button
                  type="submit"
                  disabled={loading || saving || pushBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {saving ? (
                    <CircleNotch
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <FloppyDisk size={16} aria-hidden="true" />
                  )}
                  {saving ? "Saving…" : "Save Preferences"}
                </button>
              </footer>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
