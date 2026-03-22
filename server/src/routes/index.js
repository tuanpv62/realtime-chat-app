import { Router } from "express";
import mongoose from "mongoose";
import authRouter from "./auth.route.js"; // 🆕

const router = Router();

const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

// Health check
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      status: DB_STATES[dbState] || "unknown",
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
  });
});

// 🆕 Mount auth routes
// Tất cả routes trong authRouter sẽ có prefix /auth
// Ví dụ: POST /api/v1/auth/signup
router.use("/auth", authRouter);

export default router;
