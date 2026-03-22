import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  // Log lỗi ra server console
  console.error(`[ERROR] ${req.method} ${req.url}`);
  console.error(err);

  // ── Mongoose Validation Error ──────────────────────────────────
  // Xảy ra khi vi phạm schema validation (required, minlength...)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // ── Mongoose Duplicate Key Error ───────────────────────────────
  // Xảy ra khi vi phạm unique constraint (email, username đã tồn tại)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({
      success: false,
      message: `${field} '${value}' already exists`,
    });
  }

  // ── JWT Errors ─────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // ── Mongoose Cast Error ────────────────────────────────────────
  // Xảy ra khi truyền ID không đúng format ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── Operational Error (AppError) ───────────────────────────────
  // Lỗi có kiểm soát → Trả message cho client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ── Unknown / Unexpected Error ─────────────────────────────────
  // Lỗi bất ngờ (bug) → Không expose chi tiết cho client
  // Chỉ trả generic message
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      debug: err.message,
      stack: err.stack,
    }),
  });
};

export default errorHandler;
