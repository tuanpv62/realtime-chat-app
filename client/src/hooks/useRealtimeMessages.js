import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";

// Hook cung cấp realtime send/edit/delete/react
// Thay thế HTTP API calls → Socket events
export function useRealtimeMessages(conversationId) {
  const socketStore = useSocketStore();
  const { addMessage, updateMessage } = useChatStore();
  const { user } = useAuthStore();
const tempId = `temp_${Date.now()}`;
  const sendMessage = async (payload) => {
    try {
      // Optimistic update: Hiện tin nhắn ngay trước khi server confirm
      const optimisticMessage = {
        id: tempId,
        _id: tempId,
        conversation: conversationId,
        sender: {
          id: user?.id,
          _id: user?.id,
          username: user?.username,
          displayName: user?.displayName,
          avatar: user?.avatar,
        },
        type: payload.type || "text",
        content: payload.content,
        attachments: payload.attachments || [],
        replyTo: null,
        isDeleted: false,
        isEdited: false,
        overallStatus: "sending",
        reactions: {},
        createdAt: new Date().toISOString(),
      };

      addMessage(conversationId, optimisticMessage);

      // Gửi qua socket
      const serverMessage = await socketStore.sendMessage(
        conversationId,
        payload,
      );

      // Replace optimistic message với server message
updateMessage(conversationId, tempId, {
  ...serverMessage,
  _id: serverMessage._id,
  id: serverMessage._id,
  overallStatus: "sent",
});

      return serverMessage;
    } catch (error) {
  updateMessage(conversationId, tempId, {
    overallStatus: "failed",
  });
        console.error("Failed to send message:", error);
    }
  };

  const editMessage = async (messageId, content) => {
    await socketStore.editMessage(messageId, content);
  };

  const deleteMessage = async (messageId) => {
    await socketStore.deleteMessage(messageId);
  };

  const reactToMessage = async (messageId, emoji) => {
    await socketStore.reactToMessage(messageId, emoji);
  };

  return { sendMessage, editMessage, deleteMessage, reactToMessage };
}
