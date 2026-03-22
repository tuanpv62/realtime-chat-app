import "dotenv/config";
import app from "./app.js";
import config from "./config/app.config.js";
import connectDB, { disconnectDB } from "./config/db.js"; // 🆕

const PORT = config.server.port;

// ─── Startup Sequence ────────────────────────────────────────────
// Quan trọng: Phải connect DB TRƯỚC khi start server
// Nếu DB lỗi → process.exit(1) trong connectDB → server không start
const startServer = async () => {
  // 1. Kết nối database
  await connectDB();

  // 2. Chỉ start server sau khi DB ready
  const server = app.listen(PORT, () => {
    console.log("─────────────────────────────────────");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.server.nodeEnv}`);
    console.log(`🔗 URL: http://localhost:${PORT}/api/v1`);
    console.log("─────────────────────────────────────");
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      console.log("✅ HTTP server closed");

      // 🆕 Đóng DB connection sau khi HTTP server đã đóng
      await disconnectDB();

      process.exit(0);
    });

    setTimeout(() => {
      console.error("❌ Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
  });
};

// Khởi chạy
startServer();
