/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { friendAPI } from "@/api/chat.api";

export const useNotificationStore = create((set, get) => ({
  // Số lời mời kết bạn đang chờ
  pendingRequestsCount: 0,

  // ── Fetch từ server ────────────────────────────────────────────
  fetchPendingCount: async () => {
    try {
      const { received } = await friendAPI.getPendingRequests();
      set({ pendingRequestsCount: received?.length || 0 });
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    }
  },

  // ── Tăng 1 khi nhận lời mời mới (qua socket) ─────────────────
  incrementPending: () =>
    set((s) => ({ pendingRequestsCount: s.pendingRequestsCount + 1 })),

  // ── Giảm 1 khi accept/reject ──────────────────────────────────
  decrementPending: () =>
    set((s) => ({
      pendingRequestsCount: Math.max(0, s.pendingRequestsCount - 1),
    })),

  // ── Set thẳng giá trị ─────────────────────────────────────────
  setPendingCount: (count) => set({ pendingRequestsCount: Math.max(0, count) }),

  // ── Reset về 0 ────────────────────────────────────────────────
  resetPending: () => set({ pendingRequestsCount: 0 }),
}));
