/* eslint-disable no-unused-vars */
  // eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MobileNav } from '@/components/chat/MobileNav';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/utils/cn';

export default function ChatPage() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { activeConversation, setActiveConversation } = useChatStore();

  // Mobile: Khi có conversation → ẩn sidebar, hiện chat
  const showSidebar = isDesktop || (!activeConversation && !isDesktop);
  const showChat = isDesktop || !!activeConversation;

  const handleBack = () => setActiveConversation(null);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop/Tablet: Sidebar luôn hiện ─────────────────── */}
      {isDesktop && (
        <div className="flex h-full shrink-0">
          <Sidebar />
        </div>
      )}

      {/* ── Tablet: Sidebar thu gọn ───────────────────────────── */}
      {isTablet && (
        <div className="flex h-full shrink-0">
          <CompactSidebar />
        </div>
      )}

      {/* ── Mobile: Sidebar dạng full-page ────────────────────── */}
      {isMobile && !activeConversation && (
        <div className="flex-1 flex flex-col h-full">
          <Sidebar />
        </div>
      )}

      {/* ── Chat Window ───────────────────────────────────────── */}
      {showChat && (
        <div
          className={cn(
            'flex flex-col h-full overflow-hidden',
            isMobile ? 'flex-1' : 'flex-1',
            isMobile && !activeConversation && 'hidden',
          )}
        >
          <ChatWindow
            onBack={isMobile ? handleBack : undefined}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
}

// Sidebar thu gọn cho Tablet — chỉ hiện icon rail
function CompactSidebar() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    getTotalUnread,
    setConversations,
  } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    import('@/api/chat.api').then(({ chatAPI }) => {
      chatAPI.getConversations()
        .then(setConversations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    });
  }, []);

  return (
    <div className="w-16 flex flex-col h-full border-r bg-card">
      <TabletSidebarContent
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={setActiveConversation}
        totalUnread={getTotalUnread()}
        isLoading={isLoading}
      />
    </div>
  );
}

import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, UserPlus,
  Settings, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { UnreadBadge } from '@/components/shared/UnreadBadge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


function TabletSidebarContent({
  conversations, activeConversation,

  onSelect, totalUnread, isLoading,
}) {
  const { user, signout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-center h-full py-3 gap-1">
        {/* Logo */}
        <div className="mb-2">
          <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        <Separator className="w-8 my-1" />

        {/* Conversation avatars */}
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-1 py-1 scrollbar-none">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ))
          ) : (
            conversations.slice(0, 8).map((conv) => {
              const isActive =
                (activeConversation?.id || activeConversation?._id) ===
                (conv.id || conv._id);
              const unread = conv.unreadCount || 0;
              const otherUser = conv.type === 'direct'
                ? conv.participants?.find((p) => p.id !== user?.id)
                : null;
              const displayUser = conv.type === 'group'
                ? { displayName: conv.name, avatar: conv.groupAvatar }
                : otherUser;

              return (
                <Tooltip key={conv.id || conv._id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(conv)}
                      className={cn(
                        'relative p-1 rounded-xl transition-all',
                        isActive
                          ? 'bg-primary/10 ring-2 ring-primary'
                          : 'hover:bg-accent'
                      )}
                    >
                      <UserAvatar user={displayUser} size="sm" />
                      {unread > 0 && (
                        <UnreadBadge
                          count={unread}
                          className="absolute -top-1 -right-1 text-[9px] h-4 min-w-[1rem]"
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {conv.type === 'group'
                      ? conv.name
                      : otherUser?.displayName || otherUser?.username}
                  </TooltipContent>
                </Tooltip>
              );
            })
          )}
        </div>

        <Separator className="w-8 my-1" />

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:ring-2 hover:ring-primary transition-all">
              <UserAvatar user={user} size="sm" showStatus />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <Settings className="h-4 w-4 mr-2" />
              Trang cá nhân
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={signout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}