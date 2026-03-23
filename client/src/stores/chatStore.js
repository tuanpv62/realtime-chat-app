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
  setConversations: (conversations) =>
    set({
      conversations: Array.isArray(conversations) ? conversations : [],
    }),
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
      conversations: Array.isArray(state.conversations)
        ? state.conversations.map((c) =>
            c._id === conversationId ? { ...c, ...updates } : c,
          )
        : [],
      activeConversation:
        state.activeConversation?._id === conversationId
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),

  // ── Actions: Messages ─────────────────────────────────────────
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId?.toString()]: messages,
      },
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

  // addMessage: (conversationId, message) => {
  //   const convId = conversationId?.toString();

  //   set((state) => {
  //     const existing = state.messages[convId] || [];

  //     const isDuplicate = existing.some((m) => m._id === message._id);
  //     if (isDuplicate) return state;

  //     const updatedConversations = state.conversations.map((c) =>
  //       c._id?.toString() === convId
  //         ? { ...c, lastMessage: message, updatedAt: message.createdAt }
  //         : c,
  //     );

  //     updatedConversations.sort(
  //       (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  //     );

  //     const isActive = state.activeConversation?._id?.toString() === convId;

  //     const unreadCounts = isActive
  //       ? state.unreadCounts
  //       : {
  //           ...state.unreadCounts,
  //           [convId]: (state.unreadCounts[convId] || 0) + 1,
  //         };

  //     return {
  //       messages: {
  //         ...state.messages,
  //         [convId]: [...existing, message],
  //       },
  //       conversations: updatedConversations,
  //       unreadCounts,
  //     };
  //   });
  // },

  addMessage: (conversationId, message) =>
    set((state) => {
      const convId = conversationId?.toString();
      const prev = state.messages[convId] || [];

      // 🔥 FIX DUPLICATE
      if (prev.some((m) => (m.id || m._id) === (message.id || message._id))) {
        return state;
      }

      return {
        messages: {
          ...state.messages,
          [convId]: [...prev, message],
        },
      };
    }),
  updateMessage: (conversationId, messageId, updated) =>
    set((state) => {
      const convId = conversationId?.toString();

      return {
        messages: {
          ...state.messages,
          [convId]: (state.messages[convId] || []).map((msg) =>
            msg.id === messageId ? { ...msg, ...updated } : msg,
          ),
        },
      };
    }),

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
  getMessages: (conversationId) =>
    get().messages[conversationId?.toString()] || [],

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
