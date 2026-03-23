const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 5000,
  },
  cors: {
    // Production: Hỗ trợ nhiều origins (Vercel preview URLs)
    clientUrls: process.env.CLIENT_URLS
      ? process.env.CLIENT_URLS.split(",").map((url) => url.trim())
      : ["http://localhost:5173", "http://localhost:3000"],
  },
  db: {
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/realtime-chat",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

// Validate required env vars (cả dev lẫn production)
const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`❌ Missing required env vars: ${missing.join(", ")}`);
}

export default config;
