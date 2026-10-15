"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleNotch,
  FloppyDisk,
  PaperPlaneTilt,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import api from "@/lib/api";
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

const permissionLabel = {
  granted: "Granted",
  default: "Default",
  denied: "Denied",
};

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
          checked ? "bg-zinc-900 after:translate-x-4 dark:bg-zinc-100 dark:after:bg-zinc-900" : "bg-zinc-300 dark:bg-zinc-700"
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

export default function NotificationSettingsDrawer({ isOpen, onClose, onSaved }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    let animationFrame;

    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      animationFrame = window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      previousFocusRef.current?.focus?.();
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
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
          setFeedback("Push is enabled in your account, but this browser has no active subscription. Turn it on to reconnect.");
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
  }, [isOpen]);

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
        setPushBusy(false);
        return;
      }
      updateSetting("browserPushEnabled", true);
      setFeedback("Browser desktop push is ready. Save preferences to apply it to your account.");
    } else {
      const result = await unsubscribeUserFromPush();
      if (!result.success) {
        setFeedback("This browser could not unsubscribe from push notifications.");
        setPushBusy(false);
        return;
      }
      updateSetting("browserPushEnabled", false);
      setFeedback("Browser desktop push is off. Save preferences to apply the change.");
    }

    setPushBusy(false);
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
      onSaved?.();
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

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        aria-label="Close notification settings"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-sm"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-settings-title"
        aria-describedby="notification-settings-subtitle"
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 z-10 flex w-full flex-col border-l border-zinc-200 bg-white text-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:max-w-md ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-5 dark:border-zinc-800 sm:px-6">
          <div>
            <h2
              id="notification-settings-title"
              className="text-lg font-semibold tracking-tight"
            >
              Notification Settings
            </h2>
            <p
              id="notification-settings-subtitle"
              className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
            >
              Configure browser alerts and telemetry sensitivity thresholds
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close notification settings"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {loading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500 dark:text-zinc-400"
              >
                <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
                Loading preferences…
              </div>
            ) : (
              <>
                <section aria-labelledby="delivery-title">
                  <div className="mb-2 flex items-center gap-2">
                    <SlidersHorizontal
                      size={16}
                      className="text-zinc-500 dark:text-zinc-400"
                      aria-hidden="true"
                    />
                    <h3
                      id="delivery-title"
                      className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                    >
                      Delivery Channel
                    </h3>
                  </div>
                  <div className="rounded-xl border border-zinc-200 px-3 dark:border-zinc-800">
                    <Toggle
                      checked={settings.browserPushEnabled}
                      disabled={pushBusy || saving}
                      label="Browser Desktop Push"
                      description="Receive alerts in this browser, even when the dashboard is closed."
                      onChange={(event) =>
                        void handlePushChange(event.target.checked)
                      }
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Browser permission
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                      {permissionLabel[permission] || "Default"}
                    </span>
                  </div>
                  {permission === "denied" && (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Notifications are blocked by your browser. Change this site’s notification permission in browser settings before enabling push.
                    </p>
                  )}
                </section>

                <section aria-labelledby="threshold-title">
                  <h3
                    id="threshold-title"
                    className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Alert Sensitivity Thresholds
                  </h3>
                  <div className="space-y-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <ThresholdInput
                      label="Repository Inactive Threshold"
                      value={settings.inactiveRepoDays}
                      unit="days"
                      min={1}
                      max={365}
                      onChange={(event) =>
                        updateSetting("inactiveRepoDays", event.target.value)
                      }
                    />
                    <ThresholdInput
                      label="Stuck PR Stall Threshold"
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
                  <h3
                    id="events-title"
                    className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    Event Triggers
                  </h3>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <Toggle
                      checked={settings.inactiveRepoAlerts}
                      disabled={saving}
                      label="Inactive Repositories"
                      description="Alert when a repo has no commits past the defined threshold"
                      onChange={(event) =>
                        updateSetting("inactiveRepoAlerts", event.target.checked)
                      }
                    />
                    <Toggle
                      checked={settings.stuckPrAlerts}
                      disabled={saving}
                      label="Stuck Pull Requests"
                      description="Alert on open PRs with no activity or pending reviews"
                      onChange={(event) =>
                        updateSetting("stuckPrAlerts", event.target.checked)
                      }
                    />
                    <Toggle
                      checked={settings.syncAlerts}
                      disabled={saving}
                      label="Sync Status"
                      description="Alert on GitHub synchronization errors or rate limits"
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

          <footer className="space-y-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={loading || testing || saving || dirty || !settings.browserPushEnabled}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {testing ? (
                <CircleNotch size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <PaperPlaneTilt size={17} aria-hidden="true" />
              )}
              {testing ? "Sending test…" : "Send Test Notification"}
            </button>
            {dirty && settings.browserPushEnabled && (
              <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                Save your preferences before sending a test alert.
              </p>
            )}
            <button
              type="submit"
              disabled={loading || saving || pushBusy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {saving ? (
                <CircleNotch size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <FloppyDisk size={17} aria-hidden="true" />
              )}
              {saving ? "Saving…" : "Save Preferences"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
