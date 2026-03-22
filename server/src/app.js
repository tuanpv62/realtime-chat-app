import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"; // 🆕

import config from "./config/app.config.js";
import rootRouter from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.cors.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// app.use(
//   cors({
//     origin: "http://localhost:5173", // FIX CỨNG LUÔN
//     credentials: true,
//   }),
// );

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🆕 Cookie parser — Cho phép đọc req.cookies
// Phải đặt TRƯỚC routes
app.use(cookieParser());

if (config.server.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1", rootRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

app.use(errorHandler);

export default app;
