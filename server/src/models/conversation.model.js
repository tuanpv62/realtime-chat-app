import mongoose from "mongoose";

// Conversation Schema
// Hỗ trợ cả Direct Message (2 người) và Group Chat (nhiều người)
// type: 'direct' | 'group'

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: [true, "Conversation type is required"],
    },

    // Danh sách thành viên
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Chỉ dùng cho group chat
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Group name must not exceed 100 characters"],
      default: null,
    },

    // Avatar group
    groupAvatar: {
      type: String,
      default: null,
    },

    // Admin của group (chỉ group mới cần)
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Tin nhắn cuối — Hiển thị preview trong conversation list
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Lưu thời điểm mỗi participant đọc conversation
    // { userId: ISODate } → Tính unread count
    lastReadAt: {
      type: Map,
      of: Date,
      default: {},
    },

    // Soft delete: Ẩn conversation với từng user cụ thể
    // { userId: ISODate } → User xóa conversation lúc nào
    deletedFor: {
      type: Map,
      of: Date,
      default: {},
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });

// ── Static Methods ────────────────────────────────────────────────
// Tìm hoặc tạo direct conversation giữa 2 users
conversationSchema.statics.findOrCreateDirect = async function (
  userId1,
  userId2,
) {
  // Tìm conversation đã tồn tại
  let conversation = await this.findOne({
    type: "direct",
    participants: { $all: [userId1, userId2], $size: 2 },
  })
    .populate("participants", "username displayName avatar isOnline lastSeen")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username displayName avatar" },
    });

  // Chưa có → Tạo mới
  if (!conversation) {
    conversation = await this.create({
      type: "direct",
      participants: [userId1, userId2],
    });

    conversation = await conversation.populate(
      "participants",
      "username displayName avatar isOnline lastSeen",
    );
  }

  return conversation;
};

// Virtual: Tính unread messages cho từng user
conversationSchema.methods.getUnreadCount = async function (userId) {
  const Message = mongoose.model("Message");
  const lastRead = this.lastReadAt.get(userId.toString());

  const query = {
    conversation: this._id,
    sender: { $ne: userId },
    isDeleted: false,
  };

  if (lastRead) {
    query.createdAt = { $gt: lastRead };
  }

  return Message.countDocuments(query);
};

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
