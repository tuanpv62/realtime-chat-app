import { Sidebar } from '@/components/chat/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar chiếm toàn bộ chiều cao */}
      <div className="flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}