/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  UserPlus,
  Search,
  Plus,
  LogOut,
  Settings,
  UserMinus,
  MoreHorizontal,
  Eye,

  EyeOff,
  Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ChatCard } from "./ChatCard";
import { ConversationListSkeleton } from "@/components/shared/SkeletonLoader";
import { UnreadBadge } from "@/components/shared/UnreadBadge";
import { AddFriendModal } from "./AddFriendModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { chatAPI, friendAPI } from "@/api/chat.api";
import { useBreakpoint } from "@/hooks/useBreakpoint";
// Thêm import
import { useNotificationStore } from "@/stores/notificationStore";
// Trong component Sidebar, thêm vào phần khai báo state:
const TABS = [
  { id: "chats", icon: MessageSquare, label: "Tin nhắn" },
  { id: "friends", icon: Users, label: "Bạn bè" },
];

export function Sidebar() {
  const { pendingRequestsCount } = useNotificationStore();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { user, signout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setConversations,
    setActiveConversation,
    addConversation,
    getTotalUnread,
    isUserOnline,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    chatAPI
      .getConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpenDirectChat = useCallback(
    async (friendId) => {
      try {
        const conversation = await chatAPI.getOrCreateDirect(friendId);
        const convId = conversation.id || conversation._id;
        const exists = conversations.some((c) => (c.id || c._id) === convId);
        if (!exists) addConversation(conversation);
        setActiveConversation(conversation);
        setActiveTab("chats");
      } catch (err) {
        console.error("Failed to open chat:", err);
      }
    },
    [conversations, addConversation, setActiveConversation],
  );

  const filtered = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (conv.type === "group") return conv.name?.toLowerCase().includes(q);
    return conv.participants?.some(
      (p) =>
        p.username?.toLowerCase().includes(q) ||
        p.displayName?.toLowerCase().includes(q),
    );
  });

  const directChats = filtered.filter((c) => c.type === "direct");
  const groupChats = filtered.filter((c) => c.type === "group");
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
                    variant={activeTab === id ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab(id)}
                    className="relative"
                  >
                    <Icon className="h-5 w-5" />
                    {id === "chats" && totalUnread > 0 && (
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
            <div className="flex-1" />
            <ThemeToggle />
            {/* // ── Phần Icon Rail — Cập nhật User Avatar ────────────────────────
            // Tìm đoạn DropdownMenuTrigger của User Avatar, sửa lại: */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:ring-2 hover:ring-primary transition-all mt-1 relative">
                  <UserAvatar user={user} size="sm" showStatus />

                  {/* ✅ Badge số lời mời kết bạn */}
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
                      {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{user?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile */}
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Trang cá nhân
                  {/* ✅ Badge nhỏ trong menu */}
                  {pendingRequestsCount > 0 && (
                    <span className="ml-auto h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
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
        )}

        {/* ── Main Panel ─────────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col border-r bg-background",
            isMobile ? "w-full" : "w-72",
          )}
        >
          {/* Mobile Header */}
          {isMobile && (
            <MobileHeader
              user={user}
              totalUnread={totalUnread}
              pendingRequestsCount={pendingRequestsCount} // ✅ Truyền xuống
              onAddFriend={() => setShowAddFriend(true)}
              onSignout={signout}
              onProfile={() => navigate("/profile")}
            />
          )}

          {/* Tab Bar */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            {/* Mobile: Tab bar di chuyển lên trên */}
            <div
              className={cn(
                "flex gap-1 mb-3",
                isMobile ? "justify-around" : "hidden",
              )}
            >
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeTab === id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {id === "chats" && totalUnread > 0 && (
                    <UnreadBadge
                      count={totalUnread}
                      className="text-[9px] h-4"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Title + Action (Desktop) */}
            {!isMobile && (
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base">
                  {activeTab === "chats" ? "Tin nhắn" : "Bạn bè"}
                </h2>
                {activeTab === "chats" && (
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
          {activeTab === "chats" && (
            <ScrollArea className="flex-1">
              <div className="px-2 pb-4">
                {isLoading ? (
                  <ConversationListSkeleton count={6} />
                ) : filtered.length === 0 ? (
                  <ChatEmptyState
                    hasSearch={!!searchQuery}
                    onAddFriend={() => setShowAddFriend(true)}
                    onSwitchToFriends={() => setActiveTab("friends")}
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
                              (activeConversation?.id ||
                                activeConversation?._id) ===
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
                        className={directChats.length > 0 ? "mt-3" : ""}
                      >
                        {groupChats.map((conv) => (
                          <ChatCard
                            key={conv.id || conv._id}
                            conversation={conv}
                            isActive={
                              (activeConversation?.id ||
                                activeConversation?._id) ===
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
          {activeTab === "friends" && (
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

      <AddFriendModal
        open={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(conv) => {
          addConversation(conv);
          setActiveConversation(conv);
          setActiveTab("chats");
        }}
      />
    </TooltipProvider>
  );
}

// ── Mobile Header ──────────────────────────────────────────────────
function MobileHeader({
  user,
  totalUnread,
  pendingRequestsCount,
  onAddFriend,
  onSignout,
  onProfile,
}) {
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAddFriend}
        >
          <UserPlus className="h-4 w-4" />
        </Button>

        {/* User Avatar với badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 relative">
              <UserAvatar user={user} size="sm" showStatus />
              {/* ✅ Badge */}
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfile}>
              <Settings className="h-4 w-4 mr-2" />
              Trang cá nhân
              {pendingRequestsCount > 0 && (
                <span className="ml-auto h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onSignout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
// ── Section Group ─────────────────────────────────────────────────
function SectionGroup({ label, children, className = "" }) {
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
// function FriendsList({ searchQuery, onStartChat, isUserOnline }) {
//   const [friends, setFriends] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [openingId, setOpeningId] = useState(null);

//   useEffect(() => {
//     friendAPI
//       .getFriends()
//       .then(setFriends)
//       .catch(console.error)
//       .finally(() => setIsLoading(false));
//   }, []);

//   const filtered = friends.filter((f) => {
//     if (!searchQuery?.trim()) return true;
//     const q = searchQuery.toLowerCase();
//     return (
//       f.username?.toLowerCase().includes(q) ||
//       f.displayName?.toLowerCase().includes(q)
//     );
//   });

//   const handleClick = async (friendId) => {
//     if (openingId) return;
//     setOpeningId(friendId);
//     try {
//       await onStartChat(friendId);
//     } finally {
//       setOpeningId(null);
//     }
//   };

//   if (isLoading) return <ConversationListSkeleton count={4} />;

//   if (friends.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-10 text-center px-4">
//         <Users className="h-10 w-10 text-muted-foreground mb-3" />
//         <p className="text-sm font-medium">Chưa có bạn bè</p>
//         <p className="text-xs text-muted-foreground mt-1">
//           Thêm bạn để nhắn tin
//         </p>
//       </div>
//     );
//   }

//   if (filtered.length === 0) {
//     return (
//       <div className="py-8 text-center">
//         <p className="text-sm text-muted-foreground">
//           Không tìm thấy "{searchQuery}"
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-0.5">
//       {filtered.map((friend) => {
//         const fId = friend.id || friend._id;
//         const online = isUserOnline(fId);
//         const isOpening = openingId === fId;
//         return (
//           <button
//             key={fId}
//             onClick={() => handleClick(fId)}
//             disabled={isOpening}
//             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-left transition-colors disabled:opacity-60 group"
//           >
//             <UserAvatar
//               user={{ ...friend, isOnline: online }}
//               size="sm"
//               showStatus
//             />
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium truncate">
//                 {friend.displayName || friend.username}
//               </p>
//               <p
//                 className={cn(
//                   "text-xs",
//                   online ? "text-green-500" : "text-muted-foreground",
//                 )}
//               >
//                 {online ? "● Online" : "○ Offline"}
//               </p>
//             </div>
//             <MessageSquare
//               className={cn(
//                 "h-4 w-4 shrink-0 text-muted-foreground transition-opacity",
//                 isOpening
//                   ? "opacity-100 text-primary animate-pulse"
//                   : "opacity-0 group-hover:opacity-100",
//               )}
//             />
//           </button>
//         );
//       })}
//     </div>
//   );
// }

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
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onSwitchToFriends}
        >
          <Users className="h-4 w-4 mr-2" /> Chọn bạn để nhắn tin
        </Button>
        <Button size="sm" className="w-full" onClick={onAddFriend}>
          <UserPlus className="h-4 w-4 mr-2" /> Thêm bạn mới
        </Button>
      </div>
    </div>
  );
}

// ── Confirm Dialog đơn giản ───────────────────────────────────────
function ConfirmUnfriendDialog({ friend, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xs p-5 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <UserMinus className="h-6 w-6 text-destructive" />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-base font-semibold text-center">Hủy kết bạn?</h3>
        <p className="text-sm text-muted-foreground text-center mt-1.5 leading-relaxed">
          Bạn có chắc muốn hủy kết bạn với{" "}
          <span className="font-medium text-foreground">
            {friend?.displayName || friend?.username}
          </span>
          ? Bạn vẫn có thể nhắn tin sau.
        </p>

        {/* Buttons */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Hủy kết bạn
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FriendsList ───────────────────────────────────────────────────
function FriendsList({ searchQuery, onStartChat, isUserOnline }) {
  const [friends, setFriends] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState(null); // friend object
  const [processingId, setProcessingId] = useState(null);

  // Load friends + following list
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [friendsData, followingData] = await Promise.all([
          friendAPI.getFriends(),
          friendAPI.getFollowing(),
        ]);
        setFriends(friendsData);
        // Lưu danh sách đang theo dõi vào Set để check O(1)
        setFollowingIds(new Set(followingData.map((u) => u.id || u._id)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Filter theo search
  const filtered = friends.filter((f) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.username?.toLowerCase().includes(q) ||
      f.displayName?.toLowerCase().includes(q)
    );
  });

  // ── Mở chat ──────────────────────────────────────────────────
  const handleOpenChat = async (friendId) => {
    if (openingId) return;
    setOpeningId(friendId);
    try {
      await onStartChat(friendId);
    } finally {
      setOpeningId(null);
    }
  };

  // ── Unfriend ──────────────────────────────────────────────────
  const handleUnfriend = async () => {
    if (!confirmUnfriend) return;
    const friendId = confirmUnfriend.id || confirmUnfriend._id;
    setProcessingId(friendId);
    try {
      await friendAPI.unfriend(friendId);
      setFriends((prev) => prev.filter((f) => (f.id || f._id) !== friendId));
      setConfirmUnfriend(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Follow / Unfollow ─────────────────────────────────────────
  const handleToggleFollow = async (friend) => {
    const friendId = friend.id || friend._id;
    const isFollowing = followingIds.has(friendId);
    setProcessingId(friendId);

    try {
      if (isFollowing) {
        await friendAPI.unfollow(friendId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        await friendAPI.follow(friendId);
        setFollowingIds((prev) => new Set([...prev, friendId]));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <ConversationListSkeleton count={4} />;

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <UserMinus className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Chưa có bạn bè</p>
        <p className="text-xs text-muted-foreground mt-1">
          Thêm bạn để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0.5">
        {filtered.map((friend) => {
          const fId = friend.id || friend._id;
          const online = isUserOnline(fId);
          const isOpening = openingId === fId;
          const isProcessing = processingId === fId;
          const isFollowing = followingIds.has(fId);

          return (
            <div
              key={fId}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent group transition-colors"
            >
              {/* Avatar + Name — click để chat */}
              <button
                onClick={() => handleOpenChat(fId)}
                disabled={isOpening}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left disabled:opacity-60"
              >
                <UserAvatar
                  user={{ ...friend, isOnline: online }}
                  size="sm"
                  showStatus
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {friend.displayName || friend.username}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        "text-xs",
                        online ? "text-green-500" : "text-muted-foreground",
                      )}
                    >
                      {online ? "● Online" : "○ Offline"}
                    </p>
                    {/* Badge theo dõi */}
                    {isFollowing && (
                      <span className="text-[10px] text-primary bg-primary/10 rounded px-1 py-0.5 leading-none">
                        Đang theo dõi
                      </span>
                    )}
                  </div>
                </div>

                {/* Spinner khi mở chat */}
                {isOpening && (
                  <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </button>

              {/* ── Nút 3 chấm ───────────────────────────────── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      "text-muted-foreground hover:text-foreground hover:bg-muted",
                      "transition-all duration-150",
                      // Ẩn khi không hover (desktop), luôn hiện trên mobile
                      "opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                      "max-sm:opacity-100", // Luôn hiện trên mobile
                    )}
                    disabled={isProcessing}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isProcessing ? (
                      <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-52 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Nhắn tin */}
                  <DropdownMenuItem
                    onClick={() => handleOpenChat(fId)}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Nhắn tin
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Theo dõi / Hủy theo dõi */}
                  <DropdownMenuItem
                    onClick={() => handleToggleFollow(friend)}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm">Hủy theo dõi</p>
                          <p className="text-xs text-muted-foreground">
                            Ngừng xem bài đăng của họ
                          </p>
                        </div>
                        <Check className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm">Theo dõi</p>
                          <p className="text-xs text-muted-foreground">
                            Xem bài đăng của họ
                          </p>
                        </div>
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Hủy kết bạn */}
                  <DropdownMenuItem
                    onClick={() => setConfirmUnfriend(friend)}
                    className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <UserMinus className="h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-sm">Hủy kết bạn</p>
                      <p className="text-xs opacity-70">
                        Xóa khỏi danh sách bạn bè
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Confirm Unfriend Dialog */}
      {confirmUnfriend && (
        <ConfirmUnfriendDialog
          friend={confirmUnfriend}
          onConfirm={handleUnfriend}
          onCancel={() => setConfirmUnfriend(null)}
        />
      )}
    </>
  );
}
