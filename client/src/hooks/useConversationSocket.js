import { useEffect, useRef } from "react";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";

// Hook join/leave conversation room khi mở chat
// Cũng handle: auto mark as seen, typing indicator
export function useConversationSocket(conversationId) {
  const { joinConversation, leaveConversation, markAsSeen, sendTyping } =
    useSocketStore();
  const { getTypingUsers } = useChatStore();

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;

    // Join room
    joinConversation(conversationId);

    // Mark messages seen sau 500ms (tránh flash)
    const seenTimer = setTimeout(() => {
      markAsSeen(conversationId);
    }, 500);

    return () => {
      clearTimeout(seenTimer);
      leaveConversation(conversationId);

      // Stop typing khi leave
      if (isTypingRef.current) {
        sendTyping(conversationId, false);
        isTypingRef.current = false;
      }
    };
  }, [conversationId]);

  // Typing handler với debounce
  const handleTyping = (isTyping) => {
    if (!conversationId) return;

    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(conversationId, true);
    }

    clearTimeout(typingTimeoutRef.current);

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTyping(conversationId, false);
      }, 2000);
    } else {
      isTypingRef.current = false;
      sendTyping(conversationId, false);
    }
  };

  const typingUsers = getTypingUsers(conversationId);

  return { handleTyping, typingUsers };
}
