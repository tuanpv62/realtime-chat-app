/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { createSocket, getSocket, disconnectSocket } from "@/socket/socket";
import { useChatStore } from "./chatStore";
import { useAuthStore } from "./authStore";
import { useNotificationStore } from "./notificationStore"; // ✅ Thêm

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,

  connect: (accessToken) => {
    const existingSocket = getSocket();
    if (existingSocket?.connected) return;

    const socket = createSocket(accessToken);

    socket.on("connect", () => {
      console.log("⚡ Socket connected:", socket.id);
      set({ isConnected: true, connectionError: null, socket });
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
      set({ connectionError: err.message, isConnected: false });
    });

    const chatStore = () => useChatStore.getState();

    // ── Chat events ──────────────────────────────────────────────
    socket.on("message:new", ({ message, conversationId }) => {
      chatStore().addMessage(conversationId, message);
    });

    socket.on(
      "message:edited",
      ({ messageId, content, isEdited, editedAt, conversationId }) => {
        chatStore().updateMessage(conversationId, messageId, {
          content,
          isEdited,
          editedAt,
        });
      },
    );

    socket.on("message:deleted", ({ messageId, conversationId }) => {
      chatStore().updateMessage(conversationId, messageId, {
        isDeleted: true,
        content: "",
        attachments: [],
      });
    });

    socket.on("message:status", ({ conversationId, messageIds, status }) => {
      messageIds.forEach((messageId) => {
        chatStore().updateMessage(conversationId, messageId, {
          overallStatus: status,
        });
      });
    });

    socket.on("message:reacted", ({ messageId, reactions, conversationId }) => {
      chatStore().updateMessage(conversationId, messageId, { reactions });
    });

    socket.on("conversation:read", ({ conversationId }) => {
      useChatStore.setState((state) => ({
        unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
      }));
    });

    socket.on("typing:start", ({ conversationId, userId }) => {
      chatStore().setUserTyping(conversationId, userId, true);
    });

    socket.on("typing:stop", ({ conversationId, userId }) => {
      chatStore().setUserTyping(conversationId, userId, false);
    });

    socket.on("users:online", (userIds) => {
      chatStore().setOnlineUsers(userIds);
    });

    socket.on("user:status", ({ userId, isOnline, lastSeen }) => {
      if (isOnline) {
        chatStore().addOnlineUser(userId);
      } else {
        chatStore().removeOnlineUser(userId);
        const conversations = chatStore().conversations;
        const updated = conversations.map((conv) => ({
          ...conv,
          participants: conv.participants?.map((p) =>
            (p.id || p._id) === userId
              ? { ...p, isOnline: false, lastSeen }
              : p,
          ),
        }));
        useChatStore.setState({ conversations: updated });
      }
    });

    socket.on("user:avatarUpdated", ({ userId, avatar }) => {
      const state = useChatStore.getState();
      const updated = state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants?.map((p) =>
          (p.id || p._id) === userId ? { ...p, avatar } : p,
        ),
      }));
      useChatStore.setState({ conversations: updated });
      const { user } = useAuthStore.getState();
      if ((user?.id || user?._id) === userId) {
        useAuthStore.getState().updateUser({ avatar });
      }
    });

    // ✅ ── Friend Request events ──────────────────────────────────
    socket.on("friend:request_received", ({ request }) => {
      // Tăng badge lên 1
      useNotificationStore.getState().incrementPending();

      // Optional: Hiện toast notification
      console.log(`🔔 Lời mời kết bạn từ ${request.sender?.displayName}`);
    });

    socket.connect();
    set({ socket });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, isConnected: false });
  },

  joinConversation: (conversationId) => {
    getSocket()?.emit("conversation:join", { conversationId });
  },

  leaveConversation: (conversationId) => {
    getSocket()?.emit("conversation:leave", { conversationId });
  },

  sendMessage: (conversationId, payload) => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket?.connected) return reject(new Error("Socket not connected"));
      socket.emit(
        "message:send",
        { conversationId, ...payload },
        (response) => {
          if (response?.error) reject(new Error(response.error));
          else resolve(response?.message);
        },
      );
    });
  },

  editMessage: (messageId, content) => {
    return new Promise((resolve, reject) => {
      getSocket()?.emit("message:edit", { messageId, content }, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve();
      });
    });
  },

  deleteMessage: (messageId) => {
    return new Promise((resolve, reject) => {
      getSocket()?.emit("message:delete", { messageId }, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve();
      });
    });
  },

  reactToMessage: (messageId, emoji) => {
    return new Promise((resolve, reject) => {
      getSocket()?.emit("message:react", { messageId, emoji }, (res) => {
        if (res?.error) reject(new Error(res.error));
        else resolve();
      });
    });
  },

  sendTyping: (conversationId, isTyping) => {
    getSocket()?.emit(isTyping ? "typing:start" : "typing:stop", {
      conversationId,
    });
  },

  markAsSeen: (conversationId) => {
    getSocket()?.emit("message:seen", { conversationId });
  },
}));
