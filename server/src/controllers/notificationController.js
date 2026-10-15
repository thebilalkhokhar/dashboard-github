const NotificationSetting = require("../models/NotificationSetting");
const { sendPushNotification } = require("../utils/pushNotifier");

const getOrCreateSettings = (userId) =>
  NotificationSetting.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const handleControllerError = (res, error, action) => {
  console.error(`${action}:`, error);
  const isValidationError = error.name === "ValidationError";
  return res.status(isValidationError ? 400 : 500).json({
    success: false,
    message: isValidationError
      ? error.message
      : "An internal server error occurred",
  });
};

const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.user._id);
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return handleControllerError(res, error, "Get notification settings error");
  }
};

const updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      "browserPushEnabled",
      "stuckPrAlerts",
      "inactiveRepoAlerts",
      "syncAlerts",
      "inactiveRepoDays",
      "stuckPrHours",
    ];
    const input = req.body;

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return res.status(400).json({
        success: false,
        message: "Please provide notification settings to update.",
      });
    }

    const unknownFields = Object.keys(input).filter(
      (field) => !allowedFields.includes(field),
    );
    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported setting: ${unknownFields.join(", ")}`,
      });
    }

    if (Object.keys(input).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one setting to update.",
      });
    }

    const updates = {};
    for (const field of allowedFields) {
      if (!(field in input)) {
        continue;
      }

      const value = input[field];
      if (field === "inactiveRepoDays" || field === "stuckPrHours") {
        const min = 1;
        const max = field === "inactiveRepoDays" ? 365 : 720;
        if (!Number.isInteger(value) || value < min || value > max) {
          return res.status(400).json({
            success: false,
            message: `${field} must be an integer between ${min} and ${max}.`,
          });
        }
      } else if (typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a boolean.`,
        });
      }

      updates[field] = value;
    }

    const settings = await NotificationSetting.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates, $setOnInsert: { user: req.user._id } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Update notification settings error",
    );
  }
};

const subscribePush = async (req, res) => {
  try {
    const subscription = req.body && req.body.subscription
      ? req.body.subscription
      : req.body;
    const { endpoint, keys } = subscription || {};

    if (
      typeof endpoint !== "string" ||
      endpoint.trim().length === 0 ||
      !keys ||
      typeof keys.p256dh !== "string" ||
      keys.p256dh.length === 0 ||
      typeof keys.auth !== "string" ||
      keys.auth.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid push subscription with endpoint and keys is required.",
      });
    }

    const settings = await getOrCreateSettings(req.user._id);
    const updatedSettings = await NotificationSetting.findOneAndUpdate(
      {
        _id: settings._id,
        "pushSubscriptions.endpoint": { $ne: endpoint },
      },
      {
        $push: {
          pushSubscriptions: {
            endpoint,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    const result =
      updatedSettings ||
      (await NotificationSetting.findById(settings._id));

    return res.status(200).json({
      success: true,
      message: updatedSettings
        ? "Push subscription saved successfully."
        : "Push subscription already exists.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, "Subscribe push error");
  }
};

const getVapidPublicKey = (req, res) =>
  res.status(200).json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });

const testPush = async (req, res) => {
  try {
    const result = await sendPushNotification(req.user._id, {
      title: "Test Alert",
      body: "Web push notifications are working correctly!",
      url: "/",
    });

    if (result.sent === 0) {
      return res.status(502).json({
        success: false,
        message: "The test push could not be delivered to any subscription.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Test push sent" });
  } catch (error) {
    console.error("Test push error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send test push.",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  subscribePush,
  getVapidPublicKey,
  testPush,
};
