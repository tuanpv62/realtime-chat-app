import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import AppError from "../utils/AppError.js";

// ── Get Conversations ─────────────────────────────────────────────
export const getConversationsService = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
    isActive: true,
  })
    .populate("participants", "username displayName avatar isOnline lastSeen")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "username displayName avatar",
      },
    })
    .sort({ updatedAt: -1 });

  // Lọc bỏ conversations đã bị xóa bởi user này
  const filtered = conversations.filter((conv) => {
    const deletedAt = conv.deletedFor.get(userId.toString());
    if (!deletedAt) return true;
    // Nếu có tin nhắn mới sau khi xóa → hiện lại
    return conv.updatedAt > deletedAt;
  });

  // Tính unread count cho từng conversation
  const withUnread = await Promise.all(
    filtered.map(async (conv) => {
      const unread = await conv.getUnreadCount(userId);
      return { ...conv.toJSON(), unreadCount: unread };
    }),
  );

  return withUnread;
};

// ── Get or Create Direct Conversation ────────────────────────────
export const getOrCreateDirectConversationService = async (
  currentUserId,
  targetUserId,
) => {
  const conversation = await Conversation.findOrCreateDirect(
    currentUserId,
    targetUserId,
  );
  return conversation;
};

// ── Create Group Conversation ─────────────────────────────────────
export const createGroupConversationService = async (
  adminId,
  name,
  participantIds,
) => {
  if (!name || name.trim().length < 2) {
    throw new AppError("Group name must be at least 2 characters", 400);
  }

  // Phải có ít nhất 2 thành viên khác (ngoài admin)
  const uniqueParticipants = [
    ...new Set([adminId.toString(), ...participantIds.map(String)]),
  ];
  if (uniqueParticipants.length < 3) {
    throw new AppError("Group must have at least 3 members", 400);
  }

  const conversation = await Conversation.create({
    type: "group",
    name: name.trim(),
    participants: uniqueParticipants,
    admin: adminId,
  });

  await conversation.populate(
    "participants",
    "username displayName avatar isOnline",
  );

  // Gửi system message thông báo tạo group
  await Message.create({
    conversation: conversation._id,
    sender: adminId,
    type: "system",
    content: `${name} group was created`,
  });

  return conversation;
};

// ── Get Messages ──────────────────────────────────────────────────
export const getMessagesService = async (
  conversationId,
  userId,
  { page = 1, limit = 30 } = {},
) => {
  // Verify user là participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError("Conversation not found or access denied", 404);
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .populate("sender", "username displayName avatar")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "username displayName avatar" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    }),
  ]);

  // Update lastReadAt → Reset unread count
  conversation.lastReadAt.set(userId.toString(), new Date());
  await conversation.save({ validateBeforeSave: false });

  return {
    messages: messages.reverse(), // Cũ → Mới
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

// ── Send Message ──────────────────────────────────────────────────
export const sendMessageService = async (
  conversationId,
  senderId,
  { content, type = "text", attachments = [], replyTo = null },
) => {
  // Verify sender là participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
    isActive: true,
  });

  if (!conversation) {
    throw new AppError("Conversation not found or access denied", 404);
  }

  // Validate: text message phải có content, hoặc phải có attachments
  if (type === "text" && !content?.trim() && attachments.length === 0) {
    throw new AppError("Message content is required", 400);
  }

  // Khởi tạo status: 'sent' cho tất cả participants (trừ sender)
  const statusMap = {};
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== senderId.toString()) {
      statusMap[participantId.toString()] = "sent";
    }
  });

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    content: content?.trim() || "",
    attachments,
    replyTo,
    status: statusMap,
  });

  // Update conversation's lastMessage + updatedAt
  conversation.lastMessage = message._id;
  conversation.lastReadAt.set(senderId.toString(), new Date());
  await conversation.save({ validateBeforeSave: false });

  // Populate để trả về đầy đủ thông tin
  await message.populate([
    { path: "sender", select: "username displayName avatar" },
    {
      path: "replyTo",
      populate: { path: "sender", select: "username displayName avatar" },
    },
  ]);

  return message;
};

// ── Delete Message ────────────────────────────────────────────────
export const deleteMessageService = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.sender.toString() !== userId.toString()) {
    throw new AppError("Not authorized to delete this message", 403);
  }

  if (message.isDeleted) throw new AppError("Message already deleted", 400);

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = "";
  message.attachments = [];
  await message.save({ validateBeforeSave: false });

  return message;
};

// ── Edit Message ──────────────────────────────────────────────────
export const editMessageService = async (messageId, userId, newContent) => {
  if (!newContent?.trim()) throw new AppError("Content is required", 400);

  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.sender.toString() !== userId.toString()) {
    throw new AppError("Not authorized to edit this message", 403);
  }

  if (message.isDeleted) throw new AppError("Cannot edit deleted message", 400);
  if (message.type !== "text")
    throw new AppError("Can only edit text messages", 400);

  message.content = newContent.trim();
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save({ validateBeforeSave: false });

  await message.populate("sender", "username displayName avatar");
  return message;
};

// ── React to Message ──────────────────────────────────────────────
export const reactToMessageService = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);
  if (message.isDeleted)
    throw new AppError("Cannot react to deleted message", 400);

  const userIdStr = userId.toString();
  const reactors = message.reactions.get(emoji) || [];
  const hasReacted = reactors.some((id) => id.toString() === userIdStr);

  if (hasReacted) {
    // Toggle off
    message.reactions.set(
      emoji,
      reactors.filter((id) => id.toString() !== userIdStr),
    );
  } else {
    // Toggle on
    message.reactions.set(emoji, [...reactors, userId]);
  }

  await message.save({ validateBeforeSave: false });
  return message;
};
