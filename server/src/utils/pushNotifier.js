const webpush = require("web-push");
const NotificationSetting = require("../models/NotificationSetting");

let vapidConfigured = false;

if (
  process.env.VAPID_MAILTO &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_MAILTO,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    vapidConfigured = true;
  } catch (error) {
    console.error("Web push VAPID configuration error:", error.message);
  }
}

const sendPushNotification = async (
  userId,
  { title, body, url, tag } = {},
) => {
  const settings = await NotificationSetting.findOne({ user: userId });

  if (!settings?.browserPushEnabled) {
    const error = new Error("Browser push notifications are not enabled.");
    error.statusCode = 400;
    throw error;
  }

  if (!settings.pushSubscriptions?.length) {
    const error = new Error("No push subscriptions are registered.");
    error.statusCode = 400;
    throw error;
  }

  if (!vapidConfigured) {
    throw new Error("Web push VAPID keys are not configured.");
  }

  const payload = {
    title,
    body,
    url: url || "/",
    tag: tag || "general-alert",
    timestamp: Date.now(),
  };
  const serializedPayload = JSON.stringify(payload);

  const results = await Promise.allSettled(
    settings.pushSubscriptions.map(async (subscription) =>
      webpush.sendNotification(subscription, serializedPayload),
    ),
  );

  const expiredEndpoints = [];
  let sent = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      sent += 1;
      return;
    }

    failed += 1;
    const error = result.reason;
    console.error("Web push delivery failed:", error?.message || error);

    if (error?.statusCode === 410 || error?.statusCode === 404) {
      expiredEndpoints.push(settings.pushSubscriptions[index].endpoint);
    }
  });

  if (expiredEndpoints.length > 0) {
    try {
      await NotificationSetting.updateOne(
        { user: userId },
        { $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } } },
      );
    } catch (error) {
      console.error("Failed to remove expired push subscriptions:", error.message);
    }
  }

  return { sent, failed };
};

module.exports = { sendPushNotification };
