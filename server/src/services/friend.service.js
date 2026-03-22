import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

// ── Send Friend Request ───────────────────────────────────────────
export const sendFriendRequestService = async (senderId, receiverId) => {
  // Không thể gửi lời mời cho chính mình
  if (senderId.toString() === receiverId.toString()) {
    throw new AppError("Cannot send friend request to yourself", 400);
  }

  // Kiểm tra receiver tồn tại
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError("User not found", 404);

  // Kiểm tra đã là bạn chưa
  const alreadyFriends = await FriendRequest.areFriends(senderId, receiverId);
  if (alreadyFriends) throw new AppError("You are already friends", 409);

  // Kiểm tra đã gửi request chưa (pending)
  const existingRequest = await FriendRequest.findOne({
    sender: senderId,
    receiver: receiverId,
    status: "pending",
  });
  if (existingRequest) throw new AppError("Friend request already sent", 409);

  // Kiểm tra người kia đã gửi request cho mình chưa
  const reverseRequest = await FriendRequest.findOne({
    sender: receiverId,
    receiver: senderId,
    status: "pending",
  });
  if (reverseRequest) {
    // Tự động accept thay vì tạo request mới
    reverseRequest.status = "accepted";
    await reverseRequest.save();
    return { request: reverseRequest, autoAccepted: true };
  }

  const request = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
  });

  await request.populate([
    { path: "sender", select: "username displayName avatar" },
    { path: "receiver", select: "username displayName avatar" },
  ]);

  return { request, autoAccepted: false };
};

// ── Respond to Friend Request ─────────────────────────────────────
export const respondFriendRequestService = async (
  requestId,
  userId,
  action, // 'accept' | 'reject'
) => {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new AppError("Friend request not found", 404);

  // Chỉ receiver mới có quyền accept/reject
  if (request.receiver.toString() !== userId.toString()) {
    throw new AppError("Not authorized to respond to this request", 403);
  }

  if (request.status !== "pending") {
    throw new AppError(`Request already ${request.status}`, 409);
  }

  request.status = action === "accept" ? "accepted" : "rejected";
  await request.save();

  await request.populate([
    { path: "sender", select: "username displayName avatar" },
    { path: "receiver", select: "username displayName avatar" },
  ]);

  return request;
};

// ── Cancel Friend Request ─────────────────────────────────────────
export const cancelFriendRequestService = async (requestId, senderId) => {
  const request = await FriendRequest.findById(requestId);
  if (!request) throw new AppError("Friend request not found", 404);

  if (request.sender.toString() !== senderId.toString()) {
    throw new AppError("Not authorized to cancel this request", 403);
  }

  if (request.status !== "pending") {
    throw new AppError("Can only cancel pending requests", 400);
  }

  request.status = "cancelled";
  await request.save();
  return request;
};

// ── Get Friend List ───────────────────────────────────────────────
export const getFriendsService = async (userId) => {
  const requests = await FriendRequest.find({
    $or: [
      { sender: userId, status: "accepted" },
      { receiver: userId, status: "accepted" },
    ],
  })
    .populate("sender", "username displayName avatar isOnline lastSeen")
    .populate("receiver", "username displayName avatar isOnline lastSeen")
    .sort({ updatedAt: -1 });

  // Trả về danh sách friend objects (không phải request objects)
  const friends = requests.map((req) => {
    const isSender = req.sender._id.toString() === userId.toString();
    return isSender ? req.receiver : req.sender;
  });

  return friends;
};

// ── Get Pending Requests ──────────────────────────────────────────
export const getPendingRequestsService = async (userId) => {
  // Requests nhận được
  const received = await FriendRequest.find({
    receiver: userId,
    status: "pending",
  })
    .populate("sender", "username displayName avatar bio")
    .sort({ createdAt: -1 });

  // Requests đã gửi
  const sent = await FriendRequest.find({
    sender: userId,
    status: "pending",
  })
    .populate("receiver", "username displayName avatar bio")
    .sort({ createdAt: -1 });

  return { received, sent };
};

// ── Unfriend ──────────────────────────────────────────────────────
export const unfriendService = async (userId, friendId) => {
  const request = await FriendRequest.findOneAndDelete({
    $or: [
      { sender: userId, receiver: friendId, status: "accepted" },
      { sender: friendId, receiver: userId, status: "accepted" },
    ],
  });

  if (!request) throw new AppError("You are not friends with this user", 404);
  return request;
};

// ── Search Users ──────────────────────────────────────────────────
export const searchUsersService = async (query, currentUserId) => {
  if (!query || query.trim().length < 2) {
    throw new AppError("Search query must be at least 2 characters", 400);
  }

  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { username: { $regex: query.trim(), $options: "i" } },
      { displayName: { $regex: query.trim(), $options: "i" } },
      { email: { $regex: query.trim(), $options: "i" } },
    ],
  })
    .select("username displayName avatar bio isOnline")
    .limit(20);

  // Đính kèm relationship status với mỗi user
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const request = await FriendRequest.findOne({
        $or: [
          { sender: currentUserId, receiver: user._id },
          { sender: user._id, receiver: currentUserId },
        ],
      }).select("status sender");

      let relationshipStatus = "none";
      let requestId = null;

      if (request) {
        requestId = request._id;
        if (request.status === "accepted") {
          relationshipStatus = "friends";
        } else if (request.status === "pending") {
          const isSender =
            request.sender.toString() === currentUserId.toString();
          relationshipStatus = isSender ? "request_sent" : "request_received";
        }
      }

      return {
        ...user.toJSON(),
        relationshipStatus,
        requestId,
      };
    }),
  );

  return usersWithStatus;
};
