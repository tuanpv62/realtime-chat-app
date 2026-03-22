import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import config from "../config/app.config.js";

// ─── Cookie Options ───────────────────────────────────────────────
export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: config.server.nodeEnv === "production",
  sameSite: config.server.nodeEnv === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

// Cookie options khi CLEAR (expire ngay lập tức)
export const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: config.server.nodeEnv === "production",
  sameSite: config.server.nodeEnv === "production" ? "none" : "lax",
  path: "/",
});

// ─── Signup Service (giữ nguyên) ─────────────────────────────────
export const signupService = async ({ username, email, password }) => {
  const existingEmail = await User.findByEmail(email);
  if (existingEmail) throw new AppError("Email already registered", 409);

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) throw new AppError("Username already taken", 409);

  const user = await User.create({ username, email, password });
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

// ─── Signin Service (giữ nguyên) ─────────────────────────────────
export const signinService = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password +refreshToken",
  );

  if (!user) throw new AppError("Invalid credentials", 401);

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new AppError("Invalid credentials", 401);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  user.password = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

// ─── Signout Service ──────────────────────────────────────────────
export const signoutService = async (userId) => {
  // Xóa refresh token trong DB → Revoke hoàn toàn
  // Dù kẻ tấn công có cookie → token trong DB đã null
  // → /refresh-token sẽ từ chối cấp token mới
  await User.findByIdAndUpdate(
    userId,
    {
      refreshToken: null,
      isOnline: false,
      lastSeen: new Date(),
    },
    { new: true },
  );
};

// ─── Refresh Token Service ────────────────────────────────────────
export const refreshTokenService = async (incomingRefreshToken) => {
  // 1. Kiểm tra có cookie không
  if (!incomingRefreshToken) {
    throw new AppError("Refresh token required", 401);
  }

  // 2. Verify JWT signature + expiry
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, config.jwt.refreshSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Refresh token expired, please sign in again", 401);
    }
    throw new AppError("Invalid refresh token", 401);
  }

  // 3. Tìm user + lấy refreshToken từ DB để so sánh
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user) {
    throw new AppError("User not found", 401);
  }

  // 4. So sánh token gửi lên với token đang lưu trong DB
  //    Đây là bước quan trọng nhất:
  //    - Nếu user đã signout → DB token = null → không khớp
  //    - Nếu user đã signin lại → DB token mới → token cũ không khớp
  //    → Chặn tái sử dụng refresh token cũ bị đánh cắp
  if (user.refreshToken !== incomingRefreshToken) {
    // Có thể đây là tấn công reuse token cũ
    // Biện pháp mạnh: Xóa luôn token trong DB (force signout mọi thiết bị)
    await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    throw new AppError(
      "Refresh token reuse detected, please sign in again",
      401,
    );
  }

  // 5. Cấp token mới (Rotation)
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // 6. Lưu refresh token mới vào DB
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  user.refreshToken = undefined;

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
