import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  reactToMessage,
} from "../controllers/message.controller.js";

const router = Router();

router.use(protect);

/**
 * @swagger
 * /conversations:
 *   get:
 *     tags: [Conversations]
 *     summary: Lấy danh sách conversations
 *     security:
 *       - bearerAuth: []
 */
router.get("/conversations", getConversations);

/**
 * @swagger
 * /conversations/direct/${userId}:
 *   get:
 *     tags: [Conversations]
 *     summary: Lấy hoặc tạo direct conversation với user
 *     security:
 *       - bearerAuth: []
 */
router.get("/conversations/direct/:userId", getOrCreateDirectConversation);

/**
 * @swagger
 * /conversations/group:
 *   post:
 *     tags: [Conversations]
 *     summary: Tạo group conversation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, participantIds]
 *             properties:
 *               name:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post("/conversations/group", createGroupConversation);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Lấy messages của conversation (có phân trang)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *   post:
 *     tags: [Messages]
 *     summary: Gửi message
 *     security:
 *       - bearerAuth: []
 */
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);

/**
 * @swagger
 * /messages/{messageId}:
 *   patch:
 *     tags: [Messages]
 *     summary: Chỉnh sửa message
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Messages]
 *     summary: Xóa message (soft delete)
 *     security:
 *       - bearerAuth: []
 */
router.patch("/messages/:messageId", editMessage);
router.delete("/messages/:messageId", deleteMessage);

/**
 * @swagger
 * /messages/{messageId}/react:
 *   post:
 *     tags: [Messages]
 *     summary: React vào message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji:
 *                 type: string
 *                 example: "👍"
 */
router.post("/messages/:messageId/react", reactToMessage);

export default router;
