import api from "./axios";

export const chatAPI = {
  // Conversations
  getConversations: async () => {
    const res = await api.get("/conversations");
    return res.data.data.conversations;
  },

  getOrCreateDirect: async (userId) => {
    const res = await api.get(`/conversations/direct/${userId}`);
    return res.data.data.conversation;
  },

  createGroup: async (payload) => {
    const res = await api.post("/conversations/group", payload);
    return res.data.data.conversation;
  },

  // Messages
  getMessages: async (conversationId, { page = 1, limit = 30 } = {}) => {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return res.data.data;
  },

  sendMessage: async (conversationId, payload) => {
    const res = await api.post(
      `/conversations/${conversationId}/messages`,
      payload,
    );
    return res.data.data.message;
  },

  editMessage: async (messageId, content) => {
    const res = await api.patch(`/messages/${messageId}`, { content });
    return res.data.data.message;
  },

  deleteMessage: async (messageId) => {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data.data.message;
  },

  reactToMessage: async (messageId, emoji) => {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data.data.message;
  },
};

export const friendAPI = {
  searchUsers: async (q) => {
    const res = await api.get("/friends/search", { params: { q } });
    return res.data.data.users;
  },

  getFriends: async () => {
    const res = await api.get("/friends");
    return res.data.data.friends;
  },

  getPendingRequests: async () => {
    const res = await api.get("/friends/requests/pending");
    return res.data.data;
  },

  sendRequest: async (receiverId) => {
    const res = await api.post("/friends/requests", { receiverId });
    return res.data.data;
  },

  respondRequest: async (requestId, action) => {
    const res = await api.patch(`/friends/requests/${requestId}`, { action });
    return res.data.data.request;
  },

  cancelRequest: async (requestId) => {
    await api.delete(`/friends/requests/${requestId}`);
  },

  unfriend: async (friendId) => {
    await api.delete(`/friends/${friendId}`);
  },
};
