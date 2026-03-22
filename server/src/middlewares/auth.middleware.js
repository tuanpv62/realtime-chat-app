import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/app.config.js";

// ─── Protect Middleware ───────────────────────────────────────────
// Dùng cho tất cả routes cần đăng nhập
// Sau khi chạy xong → req.user chứa thông tin user hiện tại

export const protect = asyncHandler(async (req, res, next) => {
  // 1. Lấy token từ Authorization header
  //    Format chuẩn: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access token required", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Access token required", 401);
  }

  // 2. Verify token
  //    jwt.verify throw error nếu:
  //    - Token sai format → JsonWebTokenError
  //    - Token hết hạn   → TokenExpiredError
  //    - Sai secret      → JsonWebTokenError
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Access token expired", 401);
    }
    throw new AppError("Invalid access token", 401);
  }

  // 3. Tìm user trong DB
  //    Kiểm tra user vẫn còn tồn tại (có thể đã bị xóa sau khi token được cấp)
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  // 4. Attach user vào request
  //    Các middleware/controller sau có thể dùng req.user
  req.user = user;

  next();
});

// ─── Optional Auth Middleware ─────────────────────────────────────
// Dùng cho routes có thể dùng được cả khi chưa đăng nhập
// Nếu có token hợp lệ → attach req.user
// Nếu không có token hoặc token lỗi → tiếp tục mà không có req.user
// Ví dụ: GET /posts (ai cũng xem được, nhưng nếu đăng nhập thì hiện thêm thông tin)

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Không có token → tiếp tục bình thường
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user; // Attach nếu tìm thấy
    }
  } catch {
    // Token lỗi → bỏ qua, không throw error
  }

  next();
});
