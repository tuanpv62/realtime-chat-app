// Tập trung tất cả biến môi trường vào một nơi
// Lợi ích: Dễ kiểm soát, dễ validate, không bị typo khi dùng rải rác

const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 5000,
  },
  cors: {
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  },
  db: {
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/realtime-chat",
  },
  // 🆕 JWT config
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};

// ─── Validate Required Env Vars ──────────────────────────────────
// Fail fast: Kiểm tra ngay khi server start
// Tránh lỗi bí ẩn sau khi deploy (thiếu env var)
const requiredEnvVars = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

if (process.env.NODE_ENV === "production") {
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}

export default config;
