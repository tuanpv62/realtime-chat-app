import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

// Bảo vệ routes cần đăng nhập
// Nếu chưa đăng nhập → redirect về /signin
// Lưu lại URL đang cố vào (state.from) để redirect sau khi login thành công

export default function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore();
  const location = useLocation();

  // Đang check auth (đầu tiên load app) → Show spinner
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → Redirect về signin
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}