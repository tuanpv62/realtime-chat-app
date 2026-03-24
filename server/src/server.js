import "dotenv/config";
import { createServer } from "http"; // 🆕
import app from "./app.js";
import config from "./config/app.config.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/socket.js"; // 🆕
import cors from "cors";

// const PORT = config.server.port;

const PORT = process.env.PORT || config.server.port;

const startServer = async () => {
  console.log("🚀 SERVER STARTING...");
  await connectDB();
  console.log("🚀 DATABASE CONNECTED...");
  console.log("ENV CHECK:", {
    PORT: process.env.PORT,
    MONGO: process.env.MONGODB_URI ? "OK" : "MISSING",
  });
  // 🆕 Tạo HTTP server từ Express app
  // Socket.IO cần raw HTTP server, không phải Express app
  const httpServer = createServer(app);

  // 🆕 Init Socket.IO
  const io = initSocket(httpServer);

  // Attach io vào app để dùng trong controllers nếu cần
  app.set("io", io);
const allowedOrigins = [
  "http://localhost:5173",
  "https://realtime-chat-app-hazel-six.vercel.app",
  "https://realtime-chat-gh30s2unf-tuanpv62s-projects.vercel.app", // 🔥 thêm cái này
  "https://realtime-chat-app-tuanpv62s-projects.vercel.app",
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   }),
// );
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("─────────────────────────────────────");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.server.nodeEnv}`);
    console.log(`🔗 HTTP: http://localhost:${PORT}/api/v1`);
    console.log(`⚡ Socket.IO: ws://localhost:${PORT}`);
    console.log("─────────────────────────────────────");
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down...`);
    httpServer.close(async () => {
      const { disconnectDB } = await import("./config/db.js");
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
  });
};

startServer();
