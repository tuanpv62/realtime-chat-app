/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore"; // ✅

export function useInitAuth() {
  const { initializeAuth, isInitialized, user } = useAuthStore();
  const { fetchPendingCount } = useNotificationStore(); // ✅

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, []);

  // ✅ Fetch pending requests khi user đã đăng nhập
  useEffect(() => {
    if (user) {
      fetchPendingCount();
    }
  }, [user?.id]);

  return isInitialized;
}
