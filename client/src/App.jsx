import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useInitAuth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import GuestRoute from '@/components/shared/GuestRoute';
import SignupPage from '@/pages/auth/SignupPage';
import SigninPage from '@/pages/auth/SigninPage';
import { Loader2 } from 'lucide-react';

// Chat page placeholder — sẽ xây dựng ở Phần 3+
// function ChatPage() {
//   const { useAuthStore } = require('@/stores/authStore');
//   const { user, signout } = useAuthStore();

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background">
//       <div className="text-center space-y-4">
//         <h1 className="text-2xl font-bold">
//           Chào mừng, {user?.displayName}! 👋
//         </h1>
//         <p className="text-muted-foreground">Chat page sẽ được xây dựng ở Phần 3</p>
//         <button
//           onClick={signout}
//           className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
//         >
//           Đăng xuất
//         </button>
//       </div>
//     </div>
//   );
// }

import { useAuthStore } from '@/stores/authStore';

function ChatPage() {
  const { user, signout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">
          Chào mừng, {user?.displayName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Chat page sẽ được xây dựng ở Phần 3
        </p>
        <button
          onClick={signout}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const isInitialized = useInitAuth();

  // Đang khởi tạo app (check auth lần đầu)
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

      {/* Guest-only routes */}
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signin"
        element={
          <GuestRoute>
            <SigninPage />
          </GuestRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
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