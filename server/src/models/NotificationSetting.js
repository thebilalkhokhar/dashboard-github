const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const notificationSettingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    browserPushEnabled: { type: Boolean, default: false },
    stuckPrAlerts: { type: Boolean, default: true },
    inactiveRepoAlerts: { type: Boolean, default: true },
    syncAlerts: { type: Boolean, default: true },
    inactiveRepoDays: { type: Number, min: 1, max: 365, default: 3 },
    stuckPrHours: { type: Number, min: 1, max: 720, default: 24 },
    pushSubscriptions: { type: [pushSubscriptionSchema], default: [] },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.NotificationSetting ||
  mongoose.model("NotificationSetting", notificationSettingSchema);
