import { Router } from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger.js";
import authRouter from "./auth.route.js";
import friendRouter from "./friend.route.js";
import messageRouter from "./message.route.js";
import userRouter from "./user.route.js"; // 🆕

const router = Router();

const DB_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "🚀 Chat API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

router.get("/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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

router.use("/auth", authRouter);
router.use("/friends", friendRouter);
router.use("/users", userRouter); // 🆕
router.use("/", messageRouter);

export default router;
