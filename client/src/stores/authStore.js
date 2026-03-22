// import { create } from "zustand";
// import { authAPI } from "@/api/auth.api";
// import { setAuthStoreRef } from "@/api/axios";

// export const useAuthStore = create((set) => ({
//   user: null,
//   accessToken: null,
//   isLoading: false,
//   isInitialized: false,

//   signup: async (credentials) => {
//     set({ isLoading: true });
//     try {
//       const data = await authAPI.signup(credentials);
//       set({ user: data.user, accessToken: data.accessToken, isLoading: false });
//       return data;
//     } catch (err) {
//       set({ isLoading: false });
//       throw err;
//     }
//   },

//   signin: async (credentials) => {
//     set({ isLoading: true });
//     try {
//       const data = await authAPI.signin(credentials);
//       set({ user: data.user, accessToken: data.accessToken, isLoading: false });
//       return data;
//     } catch (err) {
//       set({ isLoading: false });
//       throw err;
//     }
//   },

//   signout: async () => {
//     set({ isLoading: true });
//     try {
//       await authAPI.signout();
//     } catch {
//       /* empty */
//     } finally {
//       set({ user: null, accessToken: null, isLoading: false });
//     }
//   },

//   refreshAccessToken: async () => {
//     try {
//       const data = await authAPI.refreshToken();
//       set({ accessToken: data.accessToken, user: data.user });
//       return data.accessToken;
//     } catch {
//       set({ user: null, accessToken: null });
//       return null;
//     }
//   },

//   initializeAuth: async () => {
//     try {
//       const data = await authAPI.getMe();
//       set({ user: data.user, isInitialized: true });
//     } catch {
//       try {
//         const data = await authAPI.refreshToken();
//         set({
//           user: data.user,
//           accessToken: data.accessToken,
//           isInitialized: true,
//         });
//       } catch {
//         set({ user: null, accessToken: null, isInitialized: true });
//       }
//     }
//   },

//   setAccessToken: (token) => set({ accessToken: token }),
//   setUser: (user) => set({ user }),
//   updateUser: (updates) =>
//     set((state) => ({
//       user: state.user ? { ...state.user, ...updates } : null,
//     })),
// }));

// // Connect axios interceptor với store
// setAuthStoreRef(useAuthStore);

import { create } from "zustand";
import { authAPI } from "@/api/auth.api";
import { setAuthStoreRef } from "@/api/axios";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,

  signup: async (credentials) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.signup(credentials);
      set({ user: data.user, accessToken: data.accessToken, isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signin: async (credentials) => {
    set({ isLoading: true });
    try {
      const data = await authAPI.signin(credentials);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  signout: async () => {
    try {
      await authAPI.signout();
    } finally {
      set({ user: null, accessToken: null });
    }
  },

  refreshAccessToken: async () => {
    try {
      const data = await authAPI.refreshToken();
      set({ accessToken: data.accessToken, user: data.user });
      return data.accessToken;
    } catch {
      set({ user: null, accessToken: null });
      return null;
    }
  },

  // initializeAuth: async () => {
  //   try {
  //     const data = await authAPI.getMe();
  //     set({ user: data.user, isInitialized: true });
  //   } catch {
  //     try {
  //       const data = await authAPI.refreshToken();
  //       set({
  //         user: data.user,
  //         accessToken: data.accessToken,
  //         isInitialized: true,
  //       });
  //     } catch {
  //       set({ user: null, accessToken: null, isInitialized: true });
  //     }
  //   }
  // },
  initializeAuth: async () => {
  try {
    // ❌ bỏ getMe trước
    const data = await authAPI.refreshToken();
    set({
      user: data.user,
      accessToken: data.accessToken,
      isInitialized: true,
    });
  } catch {
    set({ user: null, accessToken: null, isInitialized: true });
  }
},

  setAccessToken: (token) => set({ accessToken: token }),
}));

setAuthStoreRef(useAuthStore);