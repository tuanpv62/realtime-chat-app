import api from "./axios";

export const userAPI = {
  getProfile: async (userId) => {
    const res = await api.get(`/users/${userId}`);
    return res.data.data.user;
  },

  updateProfile: async (data) => {
    const res = await api.patch("/users/me", data);
    return res.data.data.user;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  uploadAttachments: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("attachments", file));
    const res = await api.post("/users/upload-attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data.attachments;
  },

  changePassword: async (data) => {
    const res = await api.patch("/users/me/password", data);
    return res.data;
  },
};
