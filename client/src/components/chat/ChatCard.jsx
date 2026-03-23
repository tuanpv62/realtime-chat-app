import { formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { UnreadBadge } from '@/components/shared/UnreadBadge';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

// Lấy "display info" của conversation dựa theo loại
function useConversationDisplay(conversation) {
  const { user: currentUser } = useAuthStore();

  if (conversation.type === 'group') {
    return {
      name: conversation.name || 'Group Chat',
      avatar: conversation.groupAvatar,
      isOnline: false,
      user: null,
    };
  }

  // Direct: Hiển thị thông tin người còn lại
  const otherUser = conversation.participants?.find(
    (p) => p.id !== currentUser?.id && p._id !== currentUser?.id
  );

  return {
    name: otherUser?.displayName || otherUser?.username || 'Unknown',
    avatar: otherUser?.avatar,
    isOnline: otherUser?.isOnline || false,
    user: otherUser,
  };
}

function formatLastMessage(message, currentUserId) {
  if (!message) return 'Bắt đầu cuộc trò chuyện...';
  if (message.isDeleted) return '🗑 Tin nhắn đã bị thu hồi';

  const isOwn =
    message.sender?.id === currentUserId ||
    message.sender?._id === currentUserId;

  const prefix = isOwn ? 'Bạn: ' : '';

  if (message.type === 'image') return `${prefix}📷 Đã gửi ảnh`;
  if (message.type === 'file') return `${prefix}📎 Đã gửi file`;
  if (message.type === 'system') return message.content;

  return `${prefix}${message.content}`;
}

export function ChatCard({ conversation, isActive, onClick }) {
  const { user: currentUser } = useAuthStore();
  const { isUserOnline } = useChatStore();
  const { name, user } = useConversationDisplay(conversation);

    // Check online từ store (realtime) thay vì từ conversation data (stale)
    // eslint-disable-next-line no-unused-vars
  const isOnline = user ? isUserOnline(user.id || user._id) : false;

  const lastMessageText = formatLastMessage(
    conversation.lastMessage,
    currentUser?.id
  );

  const timeAgo = conversation.lastMessage?.createdAt
    ? formatDistanceToNowStrict(
        new Date(conversation.lastMessage.createdAt),
        { locale: vi, addSuffix: false }
      )
    : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors group hover:bg-accent',
        isActive && 'bg-accent'
      )}
    >
      {/* Avatar */}
      <UserAvatar
        user={
          conversation.type === 'group'
            ? { displayName: name, avatar: conversation.groupAvatar }
            : user
        }
        size="md"
        showStatus={conversation.type === 'direct'}
        className="shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-xs truncate',
              conversation.unreadCount > 0
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {lastMessageText}
          </p>
          <UnreadBadge count={conversation.unreadCount} className="shrink-0" />
        </div>
      </div>
    </button>
  );
}