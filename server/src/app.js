const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

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

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`Database unavailable: ${error.message}`);
    res.status(503).json({
      success: false,
      message:
        "Database unavailable. Check the server's MongoDB configuration and network access.",
    });
  }
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
