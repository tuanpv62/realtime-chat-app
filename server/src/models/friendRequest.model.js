import mongoose from "mongoose";

// FriendRequest Schema
// Quản lý trạng thái kết bạn giữa 2 users
// Status flow: pending → accepted | rejected | cancelled

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected", "cancelled"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
    },
    // Message kèm theo lời mời (optional)
    message: {
      type: String,
      maxlength: [200, "Message must not exceed 200 characters"],
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────
// Compound index: Tìm kiếm nhanh theo cặp sender-receiver
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
// unique: true → Không thể gửi 2 lời mời cho cùng 1 người
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

// ── Static Methods ────────────────────────────────────────────────
// Kiểm tra 2 users đã là bạn bè chưa
friendRequestSchema.statics.areFriends = async function (userId1, userId2) {
  const request = await this.findOne({
    $or: [
      { sender: userId1, receiver: userId2, status: "accepted" },
      { sender: userId2, receiver: userId1, status: "accepted" },
    ],
  });
  return !!request;
};

// Kiểm tra có pending request giữa 2 users không
friendRequestSchema.statics.hasPendingRequest = async function (
  senderId,
  receiverId,
) {
  const request = await this.findOne({
    sender: senderId,
    receiver: receiverId,
    status: "pending",
  });
  return !!request;
};

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
