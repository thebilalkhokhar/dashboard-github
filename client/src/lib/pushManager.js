import api from "./api";

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("Unable to register the push service worker:", error);
    return null;
  }
};

export const subscribeUserToPush = async () => {
  if (
    typeof window === "undefined" ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { success: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, reason: "permission_denied" };
    }

    const serviceWorkerRegistration = await registerServiceWorker();
    if (!serviceWorkerRegistration) {
      return { success: false, reason: "service_worker_unavailable" };
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidResponse = await api.get("/notifications/vapid-key");
    const publicKey = vapidResponse.data?.publicKey;
    if (typeof publicKey !== "string" || publicKey.length === 0) {
      console.error("The API did not return a VAPID public key.");
      return { success: false, reason: "vapid_key_unavailable" };
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    await api.post("/notifications/subscribe", {
      subscription: subscription.toJSON(),
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Unable to subscribe to push notifications:", error);
    return { success: false, reason: "subscription_failed" };
  }
};

export const unsubscribeUserFromPush = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { success: false, reason: "unsupported" };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      return { success: true, subscription: null };
    }

    const success = await subscription.unsubscribe();
    if (!success) {
      console.error("The browser could not unsubscribe from push notifications.");
      return { success: false, reason: "unsubscribe_failed" };
    }

    return { success: true, subscription: null };
  } catch (error) {
    console.error("Unable to unsubscribe from push notifications:", error);
    return { success: false, reason: "unsubscribe_failed" };
  }
};

export const getPushSubscriptionStatus = async () => {
  const permission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { permission, subscribed: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    return { permission, subscribed: Boolean(subscription) };
  } catch (error) {
    console.error("Unable to read push subscription status:", error);
    return { permission, subscribed: false };
  }
};
