import multer from "multer";
import AppError from "../utils/AppError.js";

// Dùng memory storage: File lưu trong RAM (buffer)
// Sau đó upload lên Cloudinary rồi xóa khỏi RAM
// KHÔNG lưu file trên disk server → Phù hợp cho serverless/PaaS

const storage = multer.memoryStorage();

// File filter: Chỉ accept images
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only JPEG, PNG, WebP, GIF images are allowed", 400),
      false,
    );
  }
};

// Avatar upload: Max 5MB
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single("avatar");

// Message attachments: Max 10MB, up to 5 files
export const uploadAttachments = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,
  },
}).array("attachments", 5);

// Error handler wrapper cho multer
export const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File size too large", 400));
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new AppError("Too many files", 400));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new AppError("Unexpected file field", 400));
    }
    next(new AppError(err.message || "Upload error", 400));
  });
};
