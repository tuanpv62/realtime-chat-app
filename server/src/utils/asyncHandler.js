// Higher-order function wrap async controller
// Thay vì try/catch trong mỗi controller:
//
// ❌ Không dùng asyncHandler:
// export const signup = async (req, res, next) => {
//   try { ... } catch(err) { next(err) }
// }
//
// ✅ Dùng asyncHandler:
// export const signup = asyncHandler(async (req, res) => { ... })
//
// Lỗi tự động được forward tới errorHandler middleware
// express-async-errors đã làm việc này, nhưng asyncHandler
// là explicit hơn và không cần thêm package

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
