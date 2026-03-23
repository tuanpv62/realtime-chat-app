import { useState, useEffect, useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import {
  Phone, Video, Info, ArrowDown,
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MessageCard } from './MessageCard';
import { MessageInput } from './MessageInput';
import {
  MessageListSkeleton,
  ChatHeaderSkeleton,
} from '@/components/shared/SkeletonLoader';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatAPI } from '@/api/chat.api';
import { useConversationSocket } from '@/hooks/useConversationSocket';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

function groupMessages(messages) {
  return messages.map((msg, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const samePrev =
      prev &&
      (prev.sender?.id || prev.sender?._id) ===
        (msg.sender?.id || msg.sender?._id);
    const sameNext =
      next &&
      (next.sender?.id || next.sender?._id) ===
        (msg.sender?.id || msg.sender?._id);
    return {
      ...msg,
      showAvatar: !sameNext,
      showSenderName: !samePrev,
    };
  });
}

function EditInput({ message, onSave, onCancel }) {
  const [content, setContent] = useState(message.content);
  return (
    <div className="flex items-center gap-2 mt-1 px-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(content);
          }
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
        rows={1}
        className="flex-1 resize-none rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button size="sm" onClick={() => onSave(content)}>Lưu</Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>Huỷ</Button>
    </div>
  );
}

export function ChatWindow() {
  const { user: currentUser } = useAuthStore();
  const {
    activeConversation,
  
    setMessages,
    appendMessages,
    isUserOnline,
    hasMoreMessages,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const virtuosoRef = useRef(null);

// const conversationId =
  //   (activeConversation?.id || activeConversation?._id)?.toString();
    const conversationId = (
  activeConversation?._id ||
  activeConversation?.id
  )?.toString();

const messages = useChatStore(
  (state) => state.messages[conversationId]
  );

  

console.log("CHAT WINDOW ID:", conversationId);

  
  const safeMessages = messages || [];
 const groupedMessages = groupMessages(safeMessages);

  // 🆕 Socket hooks
  const { handleTyping, typingUsers } = useConversationSocket(conversationId);
  const { sendMessage, editMessage, deleteMessage, reactToMessage } =
    useRealtimeMessages(conversationId);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);
    setPage(1);

    chatAPI
      .getMessages(conversationId, { page: 1, limit: 30 })
      .then(({ messages: msgs, pagination }) => {
        setMessages(conversationId, msgs);
        useChatStore.setState((s) => ({
          hasMoreMessages: {
            ...s.hasMoreMessages,
            [conversationId]: pagination.hasMore,
          },
        }));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [conversationId]);

  // Scroll to bottom khi có message mới
  useEffect(() => {
    if (safeMessages.length > 0) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: safeMessages.length - 1,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [safeMessages.length]);

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages[conversationId]) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const { messages: older, pagination } = await chatAPI.getMessages(
        conversationId,
        { page: nextPage, limit: 30 }
      );
      appendMessages(conversationId, older);
      setPage(nextPage);
      useChatStore.setState((s) => ({
        hasMoreMessages: {
          ...s.hasMoreMessages,
          [conversationId]: pagination.hasMore,
        },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, page, hasMoreMessages]);

  // Handle send (via socket)
  const handleSend = async ({ content, type = 'text', replyTo: replyId }) => {
    await sendMessage({
      content,
      type,
      replyTo: replyId,
    });
    setReplyTo(null);
  };

  // Handle edit
  const handleEditSave = async (newContent) => {
    if (!editingMessage || !newContent.trim()) return;
    try {
      await editMessage(editingMessage.id || editingMessage._id, newContent);
    } catch (err) {
      console.error(err);
    }
    setEditingMessage(null);
  };

  // Display info
  const isGroup = activeConversation?.type === 'group';
  const otherUser = isGroup
    ? null
    : activeConversation?.participants?.find(
        (p) => (p.id || p._id) !== currentUser?.id
      );
  const displayName = isGroup
    ? activeConversation?.name
    : otherUser?.displayName || otherUser?.username;
  const isOnline = otherUser
    ? isUserOnline(otherUser.id || otherUser._id)
    : false;

  // Typing indicator display
  const typingArray = [...typingUsers].filter((id) => id !== currentUser?.id);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <span className="text-4xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold">Chọn một cuộc trò chuyện</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Chọn từ danh sách bên trái hoặc tìm bạn bè để bắt đầu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      {isLoading ? (
        <ChatHeaderSkeleton />
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={
                isGroup
                  ? { displayName: activeConversation.name, avatar: activeConversation.groupAvatar }
                  : otherUser
              }
              size="md"
              showStatus={!isGroup}
            />
            <div>
              <p className="font-semibold text-sm">{displayName}</p>
              {isGroup ? (
                <p className="text-xs text-muted-foreground">
                  {activeConversation.participants?.length} thành viên
                </p>
              ) : (
                <StatusBadge
                  isOnline={isOnline}
                  lastSeen={otherUser?.lastSeen}
                  showLabel
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <MessageListSkeleton />
        ) : (
            
          <Virtuoso
            ref={virtuosoRef}
            data={groupedMessages}
            followOutput="smooth"
            initialTopMostItemIndex={Math.max(0, groupedMessages.length - 1)}
            startReached={hasMoreMessages[conversationId] ? loadMore : undefined}
            atBottomStateChange={(atBottom) => setShowScrollBtn(!atBottom)}
            style={{ height: '100%' }}
            components={{
              Header: () =>
                isLoadingMore ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null,
            }}
              itemContent={(_, message) => (
              
              <div key={message.id || message._id} className="py-0.5">
                {(editingMessage && editingMessage._id === message._id) ? (
                  <EditInput
                    message={message}
                    onSave={handleEditSave}
                    onCancel={() => setEditingMessage(null)}
                    
                  />
                  
                ) : (
                  <MessageCard
                    message={message}
                    showAvatar={message.showAvatar}
                    showSenderName={isGroup && message.showSenderName}
                    onReply={setReplyTo}
                    onEdit={setEditingMessage}
                    onReact={reactToMessage}
                    onDelete={deleteMessage}
                  />
                )}
              </div>
            )}
          />
        )}

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg h-9 w-9 animate-fade-in"
            onClick={() =>
              virtuosoRef.current?.scrollToIndex({
                index: groupedMessages.length - 1,
                behavior: 'smooth',
              })
            }
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Typing Indicator */}
      {typingArray.length > 0 && (
        <div className="px-4 py-1 shrink-0">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Đang nhập...
          </span>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={isLoading}
      />
    </div>
  );
}