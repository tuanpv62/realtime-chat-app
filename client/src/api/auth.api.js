import api from "./axios";

export const authAPI = {
  signin: async ({ identifier, password }) => {
    const res = await api.post("/auth/signin", { identifier, password });
    return res.data.data; // { user, accessToken }
  },
  signup: async (credentials) => {
    const res = await api.post("/auth/signup", credentials);
    return res.data.data;
  },
  signout: async () => {
    await api.post("/auth/signout");
  },

  refreshToken: async () => {
    const res = await api.post("/auth/refresh-token");
    return res.data.data;
  },

  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data.data;
  },
};
