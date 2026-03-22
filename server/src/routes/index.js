import { Router } from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";
import authRouter from "./auth.route.js";
import friendRouter from "./friend.route.js";
import messageRouter from "./message.route.js";

const router = Router();

const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

// ── Swagger UI ────────────────────────────────────────────────────
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "🚀 Chat API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1e40af }",
    swaggerOptions: {
      persistAuthorization: true, // Nhớ token khi refresh
    },
  }),
);

// Swagger JSON raw
router.get("/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Health Check ──────────────────────────────────────────────────
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

// ── Mount Routes ──────────────────────────────────────────────────
router.use("/auth", authRouter);
router.use("/friends", friendRouter);
router.use("/", messageRouter); // /conversations, /messages

export default router;
