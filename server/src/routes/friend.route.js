import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingRequests,
  unfriend,
} from "../controllers/friend.controller.js";

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(protect);

/**
 * @swagger
 * /friends/search:
 *   get:
 *     tags: [Friends]
 *     summary: Tìm kiếm users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *     responses:
 *       200:
 *         description: Danh sách users tìm được
 */
router.get("/search", searchUsers);

/**
 * @swagger
 * /friends:
 *   get:
 *     tags: [Friends]
 *     summary: Lấy danh sách bạn bè
 *     security:
 *       - bearerAuth: []
 */
router.get("/", getFriends);

/**
 * @swagger
 * /friends/requests/pending:
 *   get:
 *     tags: [Friends]
 *     summary: Lấy danh sách lời mời kết bạn
 *     security:
 *       - bearerAuth: []
 */
router.get("/requests/pending", getPendingRequests);

/**
 * @swagger
 * /friends/requests:
 *   post:
 *     tags: [Friends]
 *     summary: Gửi lời mời kết bạn
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId:
 *                 type: string
 */
router.post("/requests", sendFriendRequest);

/**
 * @swagger
 * /friends/requests/{requestId}:
 *   patch:
 *     tags: [Friends]
 *     summary: Chấp nhận hoặc từ chối lời mời
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *   delete:
 *     tags: [Friends]
 *     summary: Huỷ lời mời đã gửi
 *     security:
 *       - bearerAuth: []
 */
router.patch("/requests/:requestId", respondFriendRequest);
router.delete("/requests/:requestId", cancelFriendRequest);

/**
 * @swagger
 * /friends/{friendId}:
 *   delete:
 *     tags: [Friends]
 *     summary: Hủy kết bạn
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:friendId", unfriend);

export default router;
