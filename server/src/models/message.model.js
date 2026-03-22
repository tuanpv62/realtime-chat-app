import mongoose from "mongoose";

// Message Schema
// Hỗ trợ text, image, file
// Có seen/delivered status
// Soft delete

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    // Loại tin nhắn
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    // Nội dung tin nhắn (text)
    content: {
      type: String,
      maxlength: [5000, "Message content must not exceed 5000 characters"],
      trim: true,
      default: "",
    },

    // File/Image attachments
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, default: "" },
        size: { type: Number, default: 0 }, // bytes
        mimeType: { type: String, default: "" },
        width: { type: Number, default: null }, // Cho image
        height: { type: Number, default: null },
      },
    ],

    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Delivery status tracking
    // { userId: 'sent' | 'delivered' | 'seen' }
    status: {
      type: Map,
      of: {
        type: String,
        enum: ["sent", "delivered", "seen"],
      },
      default: {},
    },

    // Reactions: { emoji: [userId, ...] }
    // Ví dụ: { '👍': ['userId1', 'userId2'], '❤️': ['userId3'] }
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: {},
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // Chỉnh sửa tin nhắn
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────
messageSchema.index({ conversation: 1, createdAt: -1 });
// Compound index để query messages theo conversation và sort theo thời gian
messageSchema.index({ conversation: 1, isDeleted: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// ── Virtual: Sanitized content khi bị xóa ────────────────────────
messageSchema.virtual("displayContent").get(function () {
  if (this.isDeleted) return "Tin nhắn đã bị thu hồi";
  return this.content;
});

// ── Methods ───────────────────────────────────────────────────────
// Mark message là đã seen bởi userId
messageSchema.methods.markAsSeen = function (userId) {
  this.status.set(userId.toString(), "seen");
  return this.save({ validateBeforeSave: false });
};

// Mark message là đã delivered tới userId
messageSchema.methods.markAsDelivered = function (userId) {
  const current = this.status.get(userId.toString());
  // Chỉ update nếu chưa seen (không downgrade)
  if (current !== "seen") {
    this.status.set(userId.toString(), "delivered");
    return this.save({ validateBeforeSave: false });
  }
  return Promise.resolve(this);
};

// Lấy status tổng thể của message (dựa vào tất cả participants)
messageSchema.methods.getOverallStatus = function (participantIds) {
  const statuses = participantIds
    .filter((id) => id.toString() !== this.sender.toString())
    .map((id) => this.status.get(id.toString()) || "sent");

  if (statuses.every((s) => s === "seen")) return "seen";
  if (statuses.some((s) => s === "delivered" || s === "seen"))
    return "delivered";
  return "sent";
};

// toJSON: Ẩn content khi bị xóa
messageSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    if (ret.isDeleted) {
      ret.content = "Tin nhắn đã bị thu hồi";
      ret.attachments = [];
    }
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
