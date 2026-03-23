import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useInitAuth';
import { useSocket } from '@/hooks/useSocket';          // 🆕
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import GuestRoute from '@/components/shared/GuestRoute';
import SignupPage from '@/pages/auth/SignupPage';
import SigninPage from '@/pages/auth/SigninPage';
import ChatPage from '@/pages/chat/ChatPage';
import { Loader2 } from 'lucide-react';
import ProfilePage from '@/pages/profile/ProfilePage';
// Component riêng để init socket (chỉ mount khi đã authed)
function SocketInitializer() {
  useSocket();
  return null;
}

export default function App() {
  const isInitialized = useInitAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Socket init chạy globally */}
      <SocketInitializer />

      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route
          path="/signup"
          element={<GuestRoute><SignupPage /></GuestRoute>}
        />
        <Route
          path="/signin"
          element={<GuestRoute><SigninPage /></GuestRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
        />
        // Trong Routes, thêm:
<Route
  path="/profile"
  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
/>
<Route
  path="/profile/:userId"
  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
/>
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
                <p className="mt-2 text-muted-foreground">Trang không tồn tại</p>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}