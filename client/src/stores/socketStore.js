import { create } from "zustand";
import { createSocket, getSocket, disconnectSocket } from "@/socket/socket";
import { useChatStore } from "./chatStore";
import { useAuthStore } from "@/stores/authStore";

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  connectionError: null,

  // ── Connect ───────────────────────────────────────────────────
  connect: (accessToken) => {
    const existingSocket = getSocket();

    if (existingSocket) {
      console.log("⚠️ Socket already exists");
      return;
    }

    const socket = createSocket(accessToken);

const chatStore = () => useChatStore.getState();

    // ── Connection events ────────────────────────────────────────
    socket.on("connect", () => {
      console.log("⚡ Socket connected:", socket.id);
      set({ isConnected: true, connectionError: null, socket });
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      set({ isConnected: false });
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      set({ connectionError: err.message, isConnected: false });
    });

    socket.on("reconnect", (attempt) => {
      console.log(`🔄 Socket reconnected after ${attempt} attempts`);
      set({ isConnected: true, connectionError: null });
    });
    socket.off("message:new"); // 🔥 bắt buộc

    // ══════════════════════════════════════════════════════════════
    // ── CHAT EVENT LISTENERS ─────────────────────────────────────
    // ══════════════════════════════════════════════════════════════

    // eslint-disable-next-line no-undef
    const { user } = useAuthStore.getState();

    socket.on("message:new", ({ message, conversationId }) => {
      const convId = conversationId?.toString();

      // 🔥 nếu message của mình → bỏ qua
      if (
        (message.sender?.id || message.sender?._id) === (user?.id || user?._id)
      ) {
        return;
      }

      useChatStore.getState().addMessage(convId, message);
    });

    // Thêm vào phần event listeners trong connect()

    // ── User avatar updated ──────────────────────────────────────────
    socket.on("user:avatarUpdated", ({ userId, avatar }) => {
      // Update avatar trong tất cả conversations
      const state = useChatStore.getState();
      const updatedConversations = state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants?.map((p) =>
          (p.id || p._id) === userId ? { ...p, avatar } : p,
        ),
      }));
      useChatStore.setState({ conversations: updatedConversations });

      // Update current user nếu là chính mình
      // eslint-disable-next-line no-undef
      const { user } = useAuthStore.getState();
      if ((user?.id || user?._id) === userId) {
        // eslint-disable-next-line no-undef
        useAuthStore.getState().updateUser({ avatar });
      }
    });

    // socket.on("message:new", (data) => {
    //   console.log("🔥 RECEIVED:", data);
    // });

    // ── Message edited ───────────────────────────────────────────
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

    // ── Message deleted ──────────────────────────────────────────
    socket.on("message:deleted", ({ messageId, conversationId }) => {
      chatStore().updateMessage(conversationId, messageId, {
        isDeleted: true,
        content: "",
        attachments: [],
      });
    });

    // ── Message status (seen/delivered) ──────────────────────────
    socket.on(
      "message:status",
      ({ conversationId, messageIds, status, seenBy }) => {
        messageIds.forEach((messageId) => {
          chatStore().updateMessage(conversationId, messageId, {
            overallStatus: status,
            [`status_${seenBy}`]: status,
          });
        });
      },
    );

    // ── Message reacted ──────────────────────────────────────────
    socket.on("message:reacted", ({ messageId, reactions, conversationId }) => {
      chatStore().updateMessage(conversationId, messageId, { reactions });
    });

    // ── Conversation read (clear unread) ─────────────────────────
    socket.on("conversation:read", ({ conversationId }) => {
      useChatStore.setState((state) => ({
        unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
      }));
    });

    // ── Typing ───────────────────────────────────────────────────
    socket.on("typing:start", ({ conversationId, userId }) => {
      chatStore().setUserTyping(conversationId, userId, true);
    });

    socket.on("typing:stop", ({ conversationId, userId }) => {
      chatStore().setUserTyping(conversationId, userId, false);
    });

    // ── Online status ────────────────────────────────────────────
    // Nhận danh sách users online khi connect
    socket.on("users:online", (userIds) => {
      chatStore().setOnlineUsers(userIds);
    });

    // Một user vừa online/offline
    socket.on("user:status", ({ userId, isOnline, lastSeen }) => {
      if (isOnline) {
        chatStore().addOnlineUser(userId);
      } else {
        chatStore().removeOnlineUser(userId);
        // Update lastSeen trong conversations
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

    socket.connect();
    set({ socket });
  },

  // ── Disconnect ────────────────────────────────────────────────
  disconnect: () => {
    disconnectSocket();
    set({ socket: null, isConnected: false });
  },

  // ── Emit helpers ─────────────────────────────────────────────
  joinConversation: (conversationId) => {
    getSocket()?.emit("conversation:join", { conversationId });
  },

  leaveConversation: (conversationId) => {
    getSocket()?.emit("conversation:leave", { conversationId });
  },

  sendMessage: (conversationId, payload) => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket?.connected) {
        return reject(new Error("Socket not connected"));
      }

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
    const event = isTyping ? "typing:start" : "typing:stop";
    getSocket()?.emit(event, { conversationId });
  },

  markAsSeen: (conversationId) => {
    getSocket()?.emit("message:seen", { conversationId });
  },
}));
