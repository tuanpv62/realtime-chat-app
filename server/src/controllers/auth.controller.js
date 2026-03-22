import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  signupService,
  signinService,
  signoutService,
  refreshTokenService,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../services/auth.service.js";

// ─── Signup (giữ nguyên) ──────────────────────────────────────────
export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const missingFields = [];
  if (!username) missingFields.push("username");
  if (!email) missingFields.push("email");
  if (!password) missingFields.push("password");

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      errors: missingFields.map((field) => ({
        field,
        message: `${field} is required`,
      })),
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const { user, accessToken, refreshToken } = await signupService({
    username: username.trim(),
    email: email.trim(),
    password,
  });

  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  return sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully",
    data: { user, accessToken },
  });
});

// ─── Signin (giữ nguyên) ──────────────────────────────────────────
export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const missingFields = [];
  if (!email) missingFields.push("email");
  if (!password) missingFields.push("password");

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      errors: missingFields.map((field) => ({
        field,
        message: `${field} is required`,
      })),
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  const { user, accessToken, refreshToken } = await signinService({
    email: email.trim(),
    password,
  });

  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  return sendSuccess(res, {
    statusCode: 200,
    message: "Signed in successfully",
    data: { user, accessToken },
  });
});

// ─── Signout ──────────────────────────────────────────────────────
// Route này cần protect middleware → req.user đã được attach
export const signout = asyncHandler(async (req, res) => {
  // req.user được inject bởi protect middleware
  await signoutService(req.user._id);

  // Clear cookie phía client
  // Phải dùng đúng options (httpOnly, sameSite, path)
  // nếu options không khớp → cookie không bị xóa
  res.clearCookie("refreshToken", getClearCookieOptions());

  return sendSuccess(res, {
    statusCode: 200,
    message: "Signed out successfully",
  });
});

// ─── Refresh Token ────────────────────────────────────────────────
// Nhận refreshToken từ httpOnly cookie
// Trả về accessToken mới (và refreshToken mới trong cookie)
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "No refresh token cookie",
    });
  }

  const {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  } = await refreshTokenService(incomingRefreshToken);

  res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());

  return sendSuccess(res, {
    statusCode: 200,
    message: "Token refreshed successfully",
    data: { user, accessToken },
  });
});

// ─── Get Me ───────────────────────────────────────────────────────
// Trả về thông tin user hiện tại (dựa vào token)
// Hữu ích khi client reload trang, cần lấy lại user info
export const getMe = asyncHandler(async (req, res) => {
  // req.user đã được attach bởi protect middleware
  return sendSuccess(res, {
    statusCode: 200,
    message: "User retrieved successfully",
    data: { user: req.user },
  });
});
