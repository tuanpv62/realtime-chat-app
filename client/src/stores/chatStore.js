import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  // ── Conversations ─────────────────────────────────────────────
  conversations: [],
  activeConversation: null,
  isConversationsLoading: false,

  // ── Messages ──────────────────────────────────────────────────
  messages: {},
  // messages là object: { [conversationId]: Message[] }
  // Mỗi conversation có array messages riêng
  // Tránh load lại messages khi switch conversation

  isMessagesLoading: false,
  hasMoreMessages: {},
  // hasMoreMessages: { [conversationId]: boolean }

  // ── Online Users ──────────────────────────────────────────────
  onlineUsers: new Set(),
  // Set để check O(1): onlineUsers.has(userId)

  // ── Typing ────────────────────────────────────────────────────
  typingUsers: {},
  // typingUsers: { [conversationId]: Set<userId> }

  // ── Unread ────────────────────────────────────────────────────
  unreadCounts: {},
  // unreadCounts: { [conversationId]: number }

  // ── Actions: Conversations ────────────────────────────────────
  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    // Clear unread khi mở conversation
    if (conversation) {
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [conversation._id]: 0,
        },
      }));
    }
  },

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, ...updates } : c,
      ),
      activeConversation:
        state.activeConversation?._id === conversationId
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),

  // ── Actions: Messages ─────────────────────────────────────────
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  appendMessages: (conversationId, olderMessages) =>
    // Thêm messages cũ hơn vào đầu (infinite scroll lên trên)
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...olderMessages,
          ...(state.messages[conversationId] || []),
        ],
      },
    })),

  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];

      // Tránh duplicate (realtime + optimistic update)
      const isDuplicate = existing.some((m) => m._id === message._id);
      if (isDuplicate) return state;

      // Update conversation lastMessage
      const updatedConversations = state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c,
      );

      // Sort conversations: Conversation có tin nhắn mới nhất lên đầu
      updatedConversations.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );

      // Tăng unread nếu không phải active conversation
      const isActive = state.activeConversation?._id === conversationId;
      const unreadCounts = isActive
        ? state.unreadCounts
        : {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
          };

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
        conversations: updatedConversations,
        unreadCounts,
      };
    });
  },

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m,
        ),
      },
    })),

  // ── Actions: Online Status ────────────────────────────────────
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  removeOnlineUser: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  // ── Actions: Typing ───────────────────────────────────────────
  setUserTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId]
        ? new Set(state.typingUsers[conversationId])
        : new Set();

      if (isTyping) {
        current.add(userId);
      } else {
        current.delete(userId);
      }

      return {
        typingUsers: { ...state.typingUsers, [conversationId]: current },
      };
    }),

  // ── Selectors (computed helpers) ──────────────────────────────
  // Gọi: useChatStore.getState().getMessages(convId)
  getMessages: (conversationId) => get().messages[conversationId] || [],

  isUserOnline: (userId) => get().onlineUsers.has(userId),

  getTypingUsers: (conversationId) =>
    get().typingUsers[conversationId] || new Set(),

  getUnreadCount: (conversationId) => get().unreadCounts[conversationId] || 0,

  getTotalUnread: () =>
    Object.values(get().unreadCounts).reduce((sum, n) => sum + n, 0),

  // ── Reset ─────────────────────────────────────────────────────
  reset: () =>
    set({
      conversations: [],
      activeConversation: null,
      messages: {},
      onlineUsers: new Set(),
      typingUsers: {},
      unreadCounts: {},
      hasMoreMessages: {},
    }),
}));
