import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import config from "../config/app.config.js";

// Map lưu userId → Set<socketId>
// Một user có thể đăng nhập nhiều tab/thiết bị
const userSocketMap = new Map();

// Helper: Lấy tất cả socketId của một user
const getUserSockets = (userId) => [
  ...(userSocketMap.get(userId.toString()) || new Set()),
];

// Helper: Emit tới user cụ thể (tất cả thiết bị)
const emitToUser = (io, userId, event, data) => {
  const sockets = getUserSockets(userId);
  sockets.forEach((socketId) => io.to(socketId).emit(event, data));
};

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = config.cors.clientUrls;
        if (allowedOrigins.includes(origin)) return callback(null, true);

        const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);
        if (isVercelPreview) return callback(null, true);

        callback(new Error(`Socket CORS: ${origin} not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    // Production: Compress data
    perMessageDeflate: {
      threshold: 1024,
    },
  });

  // ── Auth Middleware ──────────────────────────────────────────
  // Verify JWT token trước khi cho phép kết nối
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId).select(
        "-password -refreshToken",
      );

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user vào socket
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection Handler ───────────────────────────────────────
  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    console.log(`🔌 Socket connected: ${socket.user.username} [${socket.id}]`);

    // ── Track socket ───────────────────────────────────────────
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    // ── Update online status ───────────────────────────────────
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // ── Join tất cả conversations của user ─────────────────────
    // Khi connect → join rooms ngay để nhận messages real-time
    try {
      const conversations = await Conversation.find({
        participants: userId,
        isActive: true,
      }).select("_id");

      const roomIds = conversations.map((c) => c._id.toString());
      await socket.join(roomIds);

      console.log(`📌 ${socket.user.username} joined ${roomIds.length} rooms`);
    } catch (err) {
      console.error("Error joining rooms:", err);
    }

    // ── Notify friends: User online ────────────────────────────
    // Tìm tất cả friends để notify họ
    notifyFriendsOnlineStatus(io, socket.user, true);

    // ── Emit current online users cho client vừa connect ──────
    const onlineUserIds = [...userSocketMap.keys()];
    socket.emit("users:online", onlineUserIds);

    // ════════════════════════════════════════════════════════════
    // ── EVENT HANDLERS ─────────────────────────────────────────
    // ════════════════════════════════════════════════════════════

    // ── Join specific conversation room ───────────────────────
    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        // Verify user là participant
        const conv = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conv) return;

        await socket.join(conversationId);

        // Mark messages as seen khi join room
        await markMessagesAsSeen(io, conversationId, userId);
      } catch (err) {
        console.error("conversation:join error:", err);
      }
    });

    // ── Leave conversation room ────────────────────────────────
    socket.on("conversation:leave", ({ conversationId }) => {
      socket.leave(conversationId);
    });

    // ── Send message ───────────────────────────────────────────
    socket.on(
      "message:send",
      async (
        {
          conversationId,
          content,
          type = "text",
          attachments = [],
          replyTo = null,
        },
        callback,
      ) => {
        try {
          // Verify conversation
          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
            isActive: true,
          });

          if (!conversation) {
            return callback?.({ error: "Conversation not found" });
          }

          // Validate
          if (type === "text" && !content?.trim()) {
            return callback?.({ error: "Content required" });
          }

          // Build status map: sent cho tất cả participants trừ sender
          const statusMap = {};
          conversation.participants.forEach((pId) => {
            if (pId.toString() !== userId) {
              // Nếu participant đang online trong room → delivered
              const isInRoom = io.sockets.adapter.rooms
                .get(conversationId)
                ?.has(getUserSockets(pId.toString())[0]);

              statusMap[pId.toString()] = isInRoom ? "delivered" : "sent";
            }
          });

          // Save to DB
          const message = await Message.create({
            conversation: conversationId,
            sender: userId,
            type,
            content: content?.trim() || "",
            attachments,
            replyTo,
            status: statusMap,
          });

          // Update conversation
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date(),
            [`lastReadAt.${userId}`]: new Date(),
          });

          // Populate
          await message.populate([
            { path: "sender", select: "username displayName avatar" },
            {
              path: "replyTo",
              populate: {
                path: "sender",
                select: "username displayName avatar",
              },
            },
          ]);

          const messageData = message.toJSON();

          // Emit tới TẤT CẢ trong room (kể cả sender để sync multi-tab)
          io.to(conversationId).emit("message:new", {
            message: messageData,
            conversationId,
          });

          // Callback confirm gửi thành công
          callback?.({ success: true, message: messageData });

          // Notify participants không online về unread
          conversation.participants.forEach((pId) => {
            const pid = pId.toString();
            if (pid !== userId && !userSocketMap.has(pid)) {
              // User offline → có thể gửi push notification sau
            }
          });
        } catch (err) {
          console.error("message:send error:", err);
          callback?.({ error: "Failed to send message" });
        }
      },
    );

    // ── Mark messages as seen ──────────────────────────────────
    socket.on("message:seen", async ({ conversationId }) => {
      try {
        await markMessagesAsSeen(io, conversationId, userId);
      } catch (err) {
        console.error("message:seen error:", err);
      }
    });

    // ── Typing indicators ──────────────────────────────────────
    socket.on("typing:start", ({ conversationId }) => {
      // Broadcast tới room, TRỪ sender
      socket.to(conversationId).emit("typing:start", {
        conversationId,
        userId,
        username: socket.user.username,
        displayName: socket.user.displayName,
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // ── Edit message ───────────────────────────────────────────
    socket.on("message:edit", async ({ messageId, content }, callback) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: userId,
          isDeleted: false,
        });

        if (!message) return callback?.({ error: "Message not found" });
        if (message.type !== "text")
          return callback?.({ error: "Can only edit text" });

        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save({ validateBeforeSave: false });

        await message.populate("sender", "username displayName avatar");

        const convId = message.conversation.toString();
        io.to(convId).emit("message:edited", {
          messageId,
          content: message.content,
          isEdited: true,
          editedAt: message.editedAt,
          conversationId: convId,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("message:edit error:", err);
        callback?.({ error: "Failed to edit message" });
      }
    });

    // ── Delete message ─────────────────────────────────────────
    socket.on("message:delete", async ({ messageId }, callback) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: userId,
          isDeleted: false,
        });

        if (!message) return callback?.({ error: "Message not found" });

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = "";
        message.attachments = [];
        await message.save({ validateBeforeSave: false });

        const convId = message.conversation.toString();
        io.to(convId).emit("message:deleted", {
          messageId,
          conversationId: convId,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("message:delete error:", err);
        callback?.({ error: "Failed to delete" });
      }
    });

    // ── React to message ───────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.isDeleted) {
          return callback?.({ error: "Message not found" });
        }

        const userIdStr = userId;
        const reactors = message.reactions.get(emoji) || [];
        const hasReacted = reactors.some((id) => id.toString() === userIdStr);

        if (hasReacted) {
          message.reactions.set(
            emoji,
            reactors.filter((id) => id.toString() !== userIdStr),
          );
        } else {
          message.reactions.set(emoji, [...reactors, userId]);
        }

        await message.save({ validateBeforeSave: false });

        const convId = message.conversation.toString();
        const reactionsObj = {};
        message.reactions.forEach((users, em) => {
          reactionsObj[em] = users;
        });

        io.to(convId).emit("message:reacted", {
          messageId,
          reactions: reactionsObj,
          conversationId: convId,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("message:react error:", err);
        callback?.({ error: "Failed to react" });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      console.log(
        `🔌 Socket disconnected: ${socket.user.username} [${reason}]`,
      );

      // Xóa socket khỏi map
      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // User đã disconnect tất cả thiết bị
          userSocketMap.delete(userId);

          // Update offline status
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Notify friends
          notifyFriendsOnlineStatus(io, socket.user, false);
        }
      }
    });

    // ── Error handler ──────────────────────────────────────────
    socket.on("error", (err) => {
      console.error(`Socket error [${socket.user.username}]:`, err);
    });
  });

  return io;
};

// ── Helper: Mark messages as seen ─────────────────────────────────
async function markMessagesAsSeen(io, conversationId, viewerUserId) {
  // Tìm tất cả messages chưa seen bởi viewer này
  const unseenMessages = await Message.find({
    conversation: conversationId,
    sender: { $ne: viewerUserId },
    isDeleted: false,
    [`status.${viewerUserId}`]: { $ne: "seen" },
  }).select("_id sender status");

  if (unseenMessages.length === 0) return;

  // Bulk update
  await Message.updateMany(
    {
      _id: { $in: unseenMessages.map((m) => m._id) },
    },
    {
      $set: { [`status.${viewerUserId}`]: "seen" },
    },
  );

  // Update lastReadAt trong conversation
  await Conversation.findByIdAndUpdate(conversationId, {
    [`lastReadAt.${viewerUserId}`]: new Date(),
  });

  // Notify senders: Tin nhắn của họ đã được seen
  const senderIds = [
    ...new Set(unseenMessages.map((m) => m.sender.toString())),
  ];

  senderIds.forEach((senderId) => {
    const messageIds = unseenMessages
      .filter((m) => m.sender.toString() === senderId)
      .map((m) => m._id.toString());

    emitToUser(io, senderId, "message:status", {
      conversationId,
      messageIds,
      status: "seen",
      seenBy: viewerUserId,
    });
  });

  // Emit clear unread về cho viewer
  emitToUser(io, viewerUserId, "conversation:read", {
    conversationId,
  });
}

// ── Helper: Notify friends về online status ────────────────────────
async function notifyFriendsOnlineStatus(io, user, isOnline) {
  try {
    const FriendRequest = (await import("../models/friendRequest.model.js"))
      .default;

    const friendRequests = await FriendRequest.find({
      $or: [
        { sender: user._id, status: "accepted" },
        { receiver: user._id, status: "accepted" },
      ],
    }).select("sender receiver");

    friendRequests.forEach((req) => {
      const friendId =
        req.sender.toString() === user._id.toString()
          ? req.receiver.toString()
          : req.sender.toString();

      emitToUser(io, friendId, "user:status", {
        userId: user._id.toString(),
        isOnline,
        lastSeen: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("notifyFriends error:", err);
  }
}

export { userSocketMap, emitToUser };
