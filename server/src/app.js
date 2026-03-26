import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import config from "./config/app.config.js";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ── Security ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ── CORS (FIX TRIỆT ĐỂ) ──────────────────────────────────────────
// ⚠️ KHÔNG dùng allowedHeaders: ["*"] nữa
// ⚠️ KHÔNG custom origin phức tạp nữa

app.use(
  cors({
    origin: true, // cho phép tất cả origin (Vercel auto OK)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// 🔥 QUAN TRỌNG: xử lý preflight
app.options("*", cors());

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Log
if (config.server.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("tiny"));
}

// ── Trust proxy ───────────────────────────────────────────────────
app.set("trust proxy", 1);

// ── Test route (khuyên nên giữ) ───────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "🚀 API is running..." });
});

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/v1", rootRouter);

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// ── Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;
