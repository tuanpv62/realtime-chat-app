import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useInitAuth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import GuestRoute from '@/components/shared/GuestRoute';
import SignupPage from '@/pages/auth/SignupPage';
import SigninPage from '@/pages/auth/SigninPage';
import { Loader2 } from 'lucide-react';
import ChatPage from '@/pages/chat/ChatPage';
// eslint-disable-next-line no-unused-vars
import { useAuthStore } from '@/stores/authStore';



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
  );
}