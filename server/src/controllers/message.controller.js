import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  getConversationsService,
  getOrCreateDirectConversationService,
  createGroupConversationService,
  getMessagesService,
  sendMessageService,
  deleteMessageService,
  editMessageService,
  reactToMessageService,
} from "../services/message.service.js";

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await getConversationsService(req.user._id);
  return sendSuccess(res, { data: { conversations } });
});

export const getOrCreateDirectConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const conversation = await getOrCreateDirectConversationService(
    req.user._id,
    userId,
  );
  return sendSuccess(res, { statusCode: 200, data: { conversation } });
});

export const createGroupConversation = asyncHandler(async (req, res) => {
  const { name, participantIds } = req.body;

  if (!name || !participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({
      success: false,
      message: "name and participantIds (array) are required",
    });
  }

  const conversation = await createGroupConversationService(
    req.user._id,
    name,
    participantIds,
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: "Group created successfully",
    data: { conversation },
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const result = await getMessagesService(conversationId, req.user._id, {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100),
  });

  return sendSuccess(res, { data: result });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, type, attachments, replyTo } = req.body;

  const message = await sendMessageService(conversationId, req.user._id, {
    content,
    type,
    attachments,
    replyTo,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Message sent",
    data: { message },
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await deleteMessageService(messageId, req.user._id);
  return sendSuccess(res, { message: "Message deleted", data: { message } });
});

export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const message = await editMessageService(messageId, req.user._id, content);
  return sendSuccess(res, { message: "Message updated", data: { message } });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  if (!emoji) {
    return res
      .status(400)
      .json({ success: false, message: "emoji is required" });
  }
  const message = await reactToMessageService(messageId, req.user._id, emoji);
  return sendSuccess(res, { data: { message } });
});
