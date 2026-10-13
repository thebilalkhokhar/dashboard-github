const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Routes Registration
const syncRoutes = require("./routes/syncRoutes");
const repoRoutes = require("./routes/repoRoutes");
const prRoutes = require("./routes/prRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Routes mapping
app.use("/api/sync", syncRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/prs", prRoutes);
app.use("/api/analytics", analyticsRoutes);

module.exports = app;
