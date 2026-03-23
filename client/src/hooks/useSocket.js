import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";

// Hook khởi tạo socket khi user đăng nhập
// Disconnect khi user đăng xuất
export function useSocket() {
  const { user, accessToken } = useAuthStore();
  const { connect, disconnect, isConnected } = useSocketStore();

  useEffect(() => {
    if (user && accessToken) {
      connect(accessToken);
    } else {
      disconnect();
    }

    return () => {
      // Cleanup khi component unmount (không disconnect vì global)
    };
  }, [user, accessToken]);

  return { isConnected };
}
