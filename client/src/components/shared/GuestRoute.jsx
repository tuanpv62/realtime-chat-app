import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Route chỉ dành cho guest (chưa đăng nhập)
// Nếu đã đăng nhập → redirect về /chat
// Tránh user đã login lại vào trang signup/signin

export default function GuestRoute({ children }) {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return children;
}