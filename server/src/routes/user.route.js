import { Router } from "express";
import { protect, optionalAuth } from "../middlewares/auth.middleware.js";
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadAttachments,
  changePassword,
} from "../controllers/user.controller.js";
import {
  uploadAvatar as uploadAvatarMiddleware,
  uploadAttachments as uploadAttachmentsMiddleware,
  handleMulterError,
} from "../middlewares/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Xem profile người dùng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/:userId", optionalAuth, getUserProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Cập nhật profile
 *     security:
 *       - bearerAuth: []
 */
router.patch("/me", protect, updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 */
router.post(
  "/me/avatar",
  protect,
  handleMulterError(uploadAvatarMiddleware),
  uploadAvatar,
);

/**
 * @swagger
 * /users/upload-attachments:
 *   post:
 *     tags: [Users]
 *     summary: Upload file đính kèm
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/upload-attachments",
  protect,
  handleMulterError(uploadAttachmentsMiddleware),
  uploadAttachments,
);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 */
router.patch("/me/password", protect, changePassword);

export default router;
