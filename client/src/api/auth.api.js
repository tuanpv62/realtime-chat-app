import api from "./axios";

export const authAPI = {
  signin: async (credentials) => {
    const res = await api.post("/api/v1/auth/signin", credentials);
    return res.data.data;
  },
  signup: async (credentials) => {
    const res = await api.post("/api/v1/auth/signup", credentials);
    return res.data.data;
  },
  signout: async () => {
    await api.post("/api/v1/auth/signout");
  },

  refreshToken: async () => {
    const res = await api.post("/api/v1/auth/refresh-token");
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get("/api/v1/auth/me");
    return res.data.data;
  },
};
