import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useInitAuth';
import { useSocket } from '@/hooks/useSocket';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import GuestRoute from '@/components/shared/GuestRoute';
import SignupPage from '@/pages/auth/SignupPage';
import SigninPage from '@/pages/auth/SigninPage';
import ChatPage from '@/pages/chat/ChatPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { SplashScreen } from '@/components/pwa/SplashScreen';
import { Loader2 } from 'lucide-react';

function SocketInitializer() {
  useSocket();
  return null;
}

export default function App() {
  const isInitialized = useInitAuth();

  // Chỉ hiện splash khi là PWA standalone (đã cài)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const [splashDone, setSplashDone] = useState(
    !isStandalone // Nếu không phải PWA → bỏ qua splash
  );

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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

      {/* PWA Install Banner — hiện ở mọi trang */}
      <InstallBanner />
    </>
  );
}