import mongoose from "mongoose";
import config from "./app.config.js";

// ─── Mongoose Global Settings ────────────────────────────────────
// strictQuery: true — Chỉ cho phép query theo đúng fields trong schema
// Tránh query nhầm field không tồn tại mà không báo lỗi
mongoose.set("strictQuery", true);

// ─── Connection Event Listeners ──────────────────────────────────
// Lắng nghe các sự kiện của connection để log + xử lý

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected:", mongoose.connection.host);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

// ─── Connect Function ────────────────────────────────────────────
const connectDB = async () => {
  console.log("MONGO_URI:", process.env.MONGO_URI);
  try {
    await mongoose.connect(config.db.uri, {
      
      // ── Connection Pool ──────────────────────────────────────
      // maxPoolSize: Số lượng connection tối đa trong pool
      // Mặc định là 5, tăng lên cho production traffic cao
      maxPoolSize: 10,

      // minPoolSize: Luôn giữ sẵn ít nhất N connections
      // Tránh delay khi có request đầu tiên
      minPoolSize: 2,

      // ── Timeouts ─────────────────────────────────────────────
      // serverSelectionTimeoutMS: Thời gian chờ tìm MongoDB server
      // Nếu không tìm được trong 5s → throw error ngay, không treo
      serverSelectionTimeoutMS: 5000,

      // socketTimeoutMS: Timeout cho từng operation (query, insert...)
      // 45s đủ cho query phức tạp, tránh treo vô thời hạn
      socketTimeoutMS: 45000,

      // connectTimeoutMS: Timeout khi tạo connection mới
      connectTimeoutMS: 10000,

      // ── Heartbeat ────────────────────────────────────────────
      // heartbeatFrequencyMS: Tần suất ping server để kiểm tra còn sống
      heartbeatFrequencyMS: 10000,
    });
  } catch (error) {
    console.error("❌ MongoDB initial connection failed:", error.message);
    // Exit process khi không kết nối được DB lúc khởi động
    // Lý do: App không thể hoạt động nếu không có DB
    // process.exit(1) để Docker/PM2/Railway tự restart
    process.exit(1);
  }
};

// ─── Graceful Disconnect ─────────────────────────────────────────
// Gọi hàm này khi shutdown server để đóng connection sạch sẽ
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed gracefully");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error.message);
  }
};

export default connectDB;
