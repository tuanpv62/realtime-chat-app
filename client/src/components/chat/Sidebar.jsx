/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, UserPlus,
  Search, Plus, LogOut, Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ChatCard } from './ChatCard';
import { ConversationListSkeleton } from '@/components/shared/SkeletonLoader';
import { UnreadBadge } from '@/components/shared/UnreadBadge';
import { AddFriendModal } from './AddFriendModal';
import { CreateGroupModal } from './CreateGroupModal';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatAPI, friendAPI } from '@/api/chat.api';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const TABS = [
  { id: 'chats', icon: MessageSquare, label: 'Tin nhắn' },
  { id: 'friends', icon: Users, label: 'Bạn bè' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { user, signout } = useAuthStore();
  const {
    conversations, activeConversation,
    setConversations, setActiveConversation,
    addConversation, getTotalUnread, isUserOnline,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    chatAPI.getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpenDirectChat = useCallback(async (friendId) => {
    try {
      const conversation = await chatAPI.getOrCreateDirect(friendId);
      const convId = conversation.id || conversation._id;
      const exists = conversations.some((c) => (c.id || c._id) === convId);
      if (!exists) addConversation(conversation);
      setActiveConversation(conversation);
      setActiveTab('chats');
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  }, [conversations, addConversation, setActiveConversation]);

  const filtered = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (conv.type === 'group') return conv.name?.toLowerCase().includes(q);
    return conv.participants?.some(
      (p) =>
        p.username?.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q)
    );
  });

  const directChats = filtered.filter((c) => c.type === 'direct');
  const groupChats  = filtered.filter((c) => c.type === 'group');
  const totalUnread = getTotalUnread();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-full">

        {/* ── Icon Rail (ẩn trên mobile) ─────────────────────── */}
        {!isMobile && (
          <div className="w-14 flex flex-col items-center py-3 gap-1 border-r bg-card shrink-0">
            {/* Logo */}
            <div className="p-1.5 mb-1">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <Separator className="w-8 my-1" />

            {TABS.map(({ id, icon: Icon, label }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTab === id ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTab(id)}
                    className="relative"
                  >
                    <Icon className="h-5 w-5" />
                    {id === 'chats' && totalUnread > 0 && (
                      <UnreadBadge
                        count={totalUnread}
                        className="absolute -top-1 -right-1 text-[9px] h-4 min-w-[1rem]"
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}

            <Separator className="w-8 my-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  onClick={() => setShowAddFriend(true)}>
                  <UserPlus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Thêm bạn</TooltipContent>
            </Tooltip>

            <div className="flex-1" />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:ring-2 hover:ring-primary transition-all mt-1">
                  <UserAvatar user={user} size="sm" showStatus />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" /> Trang cá nhân
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={signout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Main Panel ─────────────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r bg-background',
          isMobile ? 'w-full' : 'w-72',
        )}>

          {/* Mobile Header */}
          {isMobile && (
            <MobileHeader
              user={user}
              totalUnread={totalUnread}
              onAddFriend={() => setShowAddFriend(true)}
              onSignout={signout}
              onProfile={() => navigate('/profile')}
            />
          )}

          {/* Tab Bar */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            {/* Mobile: Tab bar di chuyển lên trên */}
            <div className={cn(
              'flex gap-1 mb-3',
              isMobile ? 'justify-around' : 'hidden'
            )}>
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {id === 'chats' && totalUnread > 0 && (
                    <UnreadBadge count={totalUnread} className="text-[9px] h-4" />
                  )}
                </button>
              ))}
            </div>

            {/* Title + Action (Desktop) */}
            {!isMobile && (
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">
                  {activeTab === 'chats' ? 'Tin nhắn' : 'Bạn bè'}
                </h2>
                {activeTab === 'chats' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setShowCreateGroup(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tạo nhóm</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm bg-muted border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* ── Tab: Chats ──────────────────────────────────── */}
          {activeTab === 'chats' && (
            <ScrollArea className="flex-1">
              <div className="px-2 pb-4">
                {isLoading ? (
                  <ConversationListSkeleton count={6} />
                ) : filtered.length === 0 ? (
                  <ChatEmptyState
                    hasSearch={!!searchQuery}
                    onAddFriend={() => setShowAddFriend(true)}
                    onSwitchToFriends={() => setActiveTab('friends')}
                  />
                ) : (
                  <>
                    {directChats.length > 0 && (
                      <SectionGroup label="Tin nhắn trực tiếp">
                        {directChats.map((conv) => (
                          <ChatCard
                            key={conv.id || conv._id}
                            conversation={conv}
                            isActive={
                              (activeConversation?.id || activeConversation?._id) ===
                              (conv.id || conv._id)
                            }
                            onClick={() => setActiveConversation(conv)}
                          />
                        ))}
                      </SectionGroup>
                    )}
                    {groupChats.length > 0 && (
                      <SectionGroup
                        label="Nhóm"
                        className={directChats.length > 0 ? 'mt-3' : ''}
                      >
                        {groupChats.map((conv) => (
                          <ChatCard
                            key={conv.id || conv._id}
                            conversation={conv}
                            isActive={
                              (activeConversation?.id || activeConversation?._id) ===
                              (conv.id || conv._id)
                            }
                            onClick={() => setActiveConversation(conv)}
                          />
                        ))}
                      </SectionGroup>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          {/* ── Tab: Friends ─────────────────────────────────── */}
          {activeTab === 'friends' && (
            <ScrollArea className="flex-1">
              <div className="px-2 pb-4">
                {/* Mobile: Nút tạo nhóm + thêm bạn */}
                {isMobile && (
                  <div className="flex gap-2 p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowAddFriend(true)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Thêm bạn
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowCreateGroup(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Tạo nhóm
                    </Button>
                  </div>
                )}
                <FriendsList
                  searchQuery={searchQuery}
                  onStartChat={handleOpenDirectChat}
                  isUserOnline={isUserOnline}
                />
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <AddFriendModal open={showAddFriend} onClose={() => setShowAddFriend(false)} />
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(conv) => {
          addConversation(conv);
          setActiveConversation(conv);
          setActiveTab('chats');
        }}
      />
    </TooltipProvider>
  );
}

// ── Mobile Header ──────────────────────────────────────────────────
function MobileHeader({ user, totalUnread, onAddFriend, onSignout, onProfile }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base">ChatApp</span>
        {totalUnread > 0 && <UnreadBadge count={totalUnread} />}
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-8 w-8"
          onClick={onAddFriend}>
          <UserPlus className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1">
              <UserAvatar user={user} size="sm" showStatus />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfile}>
              <Settings className="h-4 w-4 mr-2" /> Trang cá nhân
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onSignout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Section Group ─────────────────────────────────────────────────
function SectionGroup({ label, children, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ── Friends List ──────────────────────────────────────────────────
function FriendsList({ searchQuery, onStartChat, isUserOnline }) {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    friendAPI.getFriends()
      .then(setFriends)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = friends.filter((f) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.username?.toLowerCase().includes(q) ||
      f.displayName?.toLowerCase().includes(q)
    );
  });

  const handleClick = async (friendId) => {
    if (openingId) return;
    setOpeningId(friendId);
    try { await onStartChat(friendId); }
    finally { setOpeningId(null); }
  };

  if (isLoading) return <ConversationListSkeleton count={4} />;

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <Users className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Chưa có bạn bè</p>
        <p className="text-xs text-muted-foreground mt-1">Thêm bạn để nhắn tin</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filtered.map((friend) => {
        const fId = friend.id || friend._id;
        const online = isUserOnline(fId);
        const isOpening = openingId === fId;
        return (
          <button
            key={fId}
            onClick={() => handleClick(fId)}
            disabled={isOpening}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-left transition-colors disabled:opacity-60 group"
          >
            <UserAvatar user={{ ...friend, isOnline: online }} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {friend.displayName || friend.username}
              </p>
              <p className={cn(
                'text-xs',
                online ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {online ? '● Online' : '○ Offline'}
              </p>
            </div>
            <MessageSquare className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-opacity',
              isOpening ? 'opacity-100 text-primary animate-pulse' : 'opacity-0 group-hover:opacity-100'
            )} />
          </button>
        );
      })}
    </div>
  );
}

// ── Chat Empty State ──────────────────────────────────────────────
function ChatEmptyState({ hasSearch, onAddFriend, onSwitchToFriends }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Không tìm thấy</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">Chưa có tin nhắn nào</p>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        Bắt đầu trò chuyện bằng cách chọn bạn bè
      </p>
      <div className="flex flex-col gap-2 w-full">
        <Button size="sm" variant="outline" className="w-full" onClick={onSwitchToFriends}>
          <Users className="h-4 w-4 mr-2" /> Chọn bạn để nhắn tin
        </Button>
        <Button size="sm" className="w-full" onClick={onAddFriend}>
          <UserPlus className="h-4 w-4 mr-2" /> Thêm bạn mới
        </Button>
      </div>
    </div>
  );
}