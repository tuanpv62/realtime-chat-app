// Chuẩn hoá tất cả API response về một format duy nhất
// Client chỉ cần handle một cấu trúc response

// ✅ Success response:
// { success: true, message: '...', data: {...} }

// ❌ Error response (từ errorHandler.js):
// { success: false, message: '...', errors: [...] }

export const sendSuccess = (
  res,
  { message = "Success", data = null, statusCode = 200 } = {},
) => {
  const response = {
    success: true,
    message,
  };

  // Chỉ include data field nếu có data
  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res,
  { message = "Something went wrong", statusCode = 500, errors = null } = {},
) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
