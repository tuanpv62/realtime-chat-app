// eslint-disable-next-line no-unused-vars
import { useState, useRef } from 'react';
import { format } from 'date-fns';
// eslint-disable-next-line no-unused-vars
import { vi } from 'date-fns/locale';
import {
  Check, CheckCheck, Clock, Trash2,
  Pencil, Reply, Smile, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/stores/authStore';
import { chatAPI } from '@/api/chat.api';
import { useChatStore } from '@/stores/chatStore';

// Quick reaction emojis
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function MessageStatus({ status }) {
  if (status === 'seen') {
    return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (status === 'sent') {
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return <Clock className="h-3 w-3 text-muted-foreground" />;
}

function ReactionDisplay({ reactions }) {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  const reactionArray = Object.entries(reactions)
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => ({ emoji, count: users.length }));

  if (reactionArray.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactionArray.map(({ emoji, count }) => (
        <span
          key={emoji}
          className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs border"
        >
          {emoji}
          {count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
        </span>
      ))}
    </div>
  );
}

export function MessageCard({
  message,
  showAvatar = true,
  showSenderName = false,
  onReply,
  onEdit,
}) {
  const { user: currentUser } = useAuthStore();
  const { updateMessage, activeConversation } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const isOwn =
    message.sender?.id === currentUser?.id ||
    message.sender?._id === currentUser?.id;

  const isDeleted = message.isDeleted;
  const isSystem = message.type === 'system';

  // ── System message ─────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const handleReact = async (emoji) => {
    try {
      const updated = await chatAPI.reactToMessage(message.id || message._id, emoji);
      updateMessage(
        activeConversation?.id || activeConversation?._id,
        message.id || message._id,
        { reactions: updated.reactions }
      );
    } catch (err) {
      console.error('React failed:', err);
    }
    setIsReacting(false);
  };

  const handleDelete = async () => {
      try {
        // eslint-disable-next-line no-unused-vars
      const updated = await chatAPI.deleteMessage(message.id || message._id);
      updateMessage(
        activeConversation?.id || activeConversation?._id,
        message.id || message._id,
        { isDeleted: true, content: '' }
      );
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2 px-4 py-0.5 group',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isOwn && (
          <UserAvatar user={message.sender} size="sm" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name (group chat) */}
        {showSenderName && !isOwn && (
          <span className="text-xs font-medium text-muted-foreground ml-1 mb-0.5">
            {message.sender?.displayName || message.sender?.username}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <div
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg mb-1 border-l-2 border-primary bg-muted max-w-full',
              'truncate'
            )}
          >
            <span className="font-medium text-primary">
              {message.replyTo.sender?.displayName || message.replyTo.sender?.username}
            </span>
            <p className="truncate text-muted-foreground">
              {message.replyTo.content || 'Tin nhắn đã bị xóa'}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'relative px-3 py-2 rounded-2xl text-sm leading-relaxed',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
            isDeleted && 'opacity-60 italic',
          )}
        >
          {/* Text content */}
          {(message.type === 'text' || isDeleted) && (
            <p className="whitespace-pre-wrap break-words">
              {isDeleted ? '🗑 Tin nhắn đã bị thu hồi' : message.content}
            </p>
          )}

          {/* Image */}
          {message.type === 'image' && !isDeleted && message.attachments?.[0] && (
            <img
              src={message.attachments[0].url}
              alt="attachment"
              className="rounded-lg max-w-[250px] max-h-[300px] object-cover cursor-pointer"
              onClick={() => window.open(message.attachments[0].url, '_blank')}
            />
          )}

          {/* Edited badge */}
          {message.isEdited && !isDeleted && (
            <span className="text-[10px] opacity-60 ml-1">(đã chỉnh sửa)</span>
          )}
        </div>

        {/* Reactions */}
        <ReactionDisplay reactions={message.reactions} />

        {/* Time + Status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-0.5 px-1',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {isOwn && !isDeleted && (
            <MessageStatus status={message.overallStatus || 'sent'} />
          )}
        </div>
      </div>

      {/* Action Buttons (hover) */}
      {!isDeleted && (
        <div
          className={cn(
            'flex items-center gap-0.5 opacity-0 transition-opacity',
            showActions && 'opacity-100',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Quick React */}
          <Popover open={isReacting} onOpenChange={setIsReacting}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Smile className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="text-lg hover:scale-125 transition-transform p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Reply */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onReply?.(message)}
          >
            <Reply className="h-3.5 w-3.5" />
          </Button>

          {/* More options (own messages only) */}
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                {message.type === 'text' && (
                  <DropdownMenuItem onClick={() => onEdit?.(message)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Thu hồi
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}