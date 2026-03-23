import { useState, useEffect } from 'react';
import {
  MessageSquare, Users, UserPlus, Settings,
  Search, Plus, LogOut, Bell,
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ChatCard } from './ChatCard';
import { ConversationListSkeleton } from '@/components/shared/SkeletonLoader';
import { UnreadBadge } from '@/components/shared/UnreadBadge';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatAPI } from '@/api/chat.api';
import { AddFriendModal } from './AddFriendModal';
import { CreateGroupModal } from './CreateGroupModal';

const TABS = [
  { id: 'chats', icon: MessageSquare, label: 'Tin nhắn' },
  { id: 'friends', icon: Users, label: 'Bạn bè' },
];

export function Sidebar() {
  const { user, signout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setConversations,
    setActiveConversation,
    getTotalUnread,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const data = await chatAPI.getConversations();
        setConversations(data);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadConversations();
  }, []);

  // Filter conversations theo search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (conv.type === 'group') {
      return conv.name?.toLowerCase().includes(q);
    }

    return conv.participants?.some(
      (p) =>
        p.username?.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q)
    );
  });

  const totalUnread = getTotalUnread();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full">
        {/* ── Icon Rail (narrow nav) ───────────────────────────── */}
        <div className="w-14 flex flex-col items-center py-3 gap-1 border-r bg-card shrink-0">
          {/* Logo */}
          <div className="p-2 mb-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>

          <Separator className="w-8 my-1" />

                  {/* Tab buttons */}
                  {/* eslint-disable-next-line no-unused-vars */}
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

          {/* Add Friend */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddFriend(true)}
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Thêm bạn</TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar + Signout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signout}
                className="p-1 rounded-full hover:ring-2 hover:ring-primary transition-all"
              >
                <UserAvatar user={user} size="sm" showStatus />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {user?.displayName} · Đăng xuất
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Main Panel ───────────────────────────────────────── */}
        <div className="w-72 flex flex-col border-r bg-background">
          {/* Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base">
                {activeTab === 'chats' ? 'Tin nhắn' : 'Bạn bè'}
              </h2>
              {activeTab === 'chats' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowCreateGroup(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tạo nhóm</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm bg-muted border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 px-2">
            {activeTab === 'chats' && (
              <>
                {isLoading ? (
                  <ConversationListSkeleton count={6} />
                ) : filteredConversations.length === 0 ? (
                  <EmptyState
                    type={searchQuery ? 'search' : 'chats'}
                    onAddFriend={() => setShowAddFriend(true)}
                  />
                ) : (
                  <div className="space-y-0.5 pb-4">
                    {/* Direct Messages */}
                    <DirectMessageList
                      conversations={filteredConversations.filter(
                        (c) => c.type === 'direct'
                      )}
                      activeConversation={activeConversation}
                      onSelect={setActiveConversation}
                    />

                    {/* Group Chats */}
                    <GroupChatList
                      conversations={filteredConversations.filter(
                        (c) => c.type === 'group'
                      )}
                      activeConversation={activeConversation}
                      onSelect={setActiveConversation}
                    />
                  </div>
                )}
              </>
            )}

                      {activeTab === 'friends' && (
                          // eslint-disable-next-line no-unused-vars
              <FriendsList onStartChat={(userId) => {
                // Sẽ mở conversation ở phần sau
              }} />
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Modals */}
      <AddFriendModal
        open={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(conv) => {
          setConversations([conv, ...conversations]);
          setActiveConversation(conv);
        }}
      />
    </TooltipProvider>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function DirectMessageList({ conversations, activeConversation, onSelect }) {
  if (conversations.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        Tin nhắn trực tiếp
      </p>
      {conversations.map((conv) => (
        <ChatCard
          key={conv.id || conv._id}
          conversation={conv}
          isActive={
            (activeConversation?.id || activeConversation?._id) ===
            (conv.id || conv._id)
          }
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
}

function GroupChatList({ conversations, activeConversation, onSelect }) {
  if (conversations.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
        Nhóm
      </p>
      {conversations.map((conv) => (
        <ChatCard
          key={conv.id || conv._id}
          conversation={conv}
          isActive={
            (activeConversation?.id || activeConversation?._id) ===
            (conv.id || conv._id)
          }
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
}

function FriendsList({ onStartChat }) {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isUserOnline } = useChatStore();

  useEffect(() => {
    import('@/api/chat.api').then(({ friendAPI }) => {
      friendAPI.getFriends()
        .then(setFriends)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    });
  }, []);

  if (isLoading) return <ConversationListSkeleton count={4} />;

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Users className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Chưa có bạn bè</p>
        <p className="text-xs text-muted-foreground mt-1">
          Thêm bạn để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 pb-4">
      {friends.map((friend) => {
        const online = isUserOnline(friend.id || friend._id);
        return (
          <button
            key={friend.id || friend._id}
            onClick={() => onStartChat(friend.id || friend._id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors"
          >
            <UserAvatar user={{ ...friend, isOnline: online }} size="sm" showStatus />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {friend.displayName || friend.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {online ? 'Online' : 'Offline'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ type, onAddFriend }) {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Không tìm thấy</p>
        <p className="text-xs text-muted-foreground mt-1">
          Thử tìm với từ khoá khác
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">Chưa có cuộc trò chuyện</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Thêm bạn và bắt đầu nhắn tin
      </p>
      <Button size="sm" onClick={onAddFriend}>
        <UserPlus className="h-4 w-4 mr-2" />
        Thêm bạn
      </Button>
    </div>
  );
}