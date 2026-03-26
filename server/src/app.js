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

// ── CORS Production Config ────────────────────────────────────────
const corsOptions = {
  // origin: (origin, callback) => {
  //   // Cho phép requests không có origin (mobile apps, Postman, server-to-server)
  //   if (!origin) return callback(null, true);

  //   const allowedOrigins = config.cors.clientUrls;

  //   // Exact match
  //   if (allowedOrigins.includes(origin)) {
  //     return callback(null, true);
  //   }

  //   // Vercel preview URLs: https://app-xxx.vercel.app
  //   const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);
  //   if (isVercelPreview) {
  //     return callback(null, true);
  //   }

  //   callback(new Error(`CORS: Origin ${origin} not allowed`));
  // },
  origin: (origin, callback) => {
    console.log("🌍 CORS Origin:", origin); // 👈 thêm dòng này

    if (!origin) return callback(null, true);

    const allowedOrigins = config.cors.clientUrls;

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);
    if (isVercelPreview) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"],
  allowedHeaders: ["*"],// Cho phép tất cả headers, bao gồm Authorization
  // Preflight cache: 24 giờ
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Pre-flight cho tất cả routes

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Log chỉ khi development
if (config.server.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  // Production: Log tối giản, không log sensitive data
  app.use(morgan("tiny"));
}

// ── Trust proxy (Render, Railway dùng reverse proxy) ──────────────
// Cần thiết để req.ip trả đúng IP thật, không phải IP của proxy
app.set("trust proxy", 1);

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
