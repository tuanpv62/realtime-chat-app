// Custom Error class — Extends built-in Error
// Lợi ích: Phân biệt "lỗi mình tạo ra" vs "lỗi bất ngờ"
// errorHandler.js sẽ kiểm tra err instanceof AppError
// để quyết định có expose message ra client không

class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Gọi Error constructor, set this.message

    this.statusCode = statusCode;

    // isOperational: Lỗi "có kiểm soát" (400, 401, 404...)
    // Ngược lại là lỗi bất ngờ (bug, DB crash...) → 500
    this.isOperational = true;

    // Giữ stack trace sạch, không include AppError constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
