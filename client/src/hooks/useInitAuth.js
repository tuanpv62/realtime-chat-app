import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useInitAuth() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  return isInitialized;
}
