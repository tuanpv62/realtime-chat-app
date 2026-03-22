import { Router } from 'express';
import {
  signup,
  signin,
  signout,
  refreshToken,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Public routes (không cần đăng nhập) ───────────────────────────
router.post('/signup', signup);
router.post('/signin', signin);

// refreshToken dùng cookie tự động → không cần Authorization header
router.post('/refresh-token', refreshToken);

// ── Protected routes (cần đăng nhập) ──────────────────────────────
// protect middleware chạy TRƯỚC controller
// Nếu token không hợp lệ → trả 401 ngay, không vào controller
router.post('/signout', protect, signout);
router.get('/me', protect, getMe);

export default router;
