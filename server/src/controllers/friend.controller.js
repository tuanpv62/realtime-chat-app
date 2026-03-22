import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  sendFriendRequestService,
  respondFriendRequestService,
  cancelFriendRequestService,
  getFriendsService,
  getPendingRequestsService,
  unfriendService,
  searchUsersService,
} from "../services/friend.service.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const users = await searchUsersService(q, req.user._id);
  return sendSuccess(res, { data: { users } });
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) {
    return res
      .status(400)
      .json({ success: false, message: "receiverId is required" });
  }
  const result = await sendFriendRequestService(req.user._id, receiverId);
  return sendSuccess(res, {
    statusCode: 201,
    message: result.autoAccepted
      ? "Friend request auto-accepted"
      : "Friend request sent",
    data: { request: result.request, autoAccepted: result.autoAccepted },
  });
});

export const respondFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;

  if (!["accept", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action must be accept or reject",
    });
  }

  const request = await respondFriendRequestService(
    requestId,
    req.user._id,
    action,
  );
  return sendSuccess(res, {
    message:
      action === "accept"
        ? "Friend request accepted"
        : "Friend request rejected",
    data: { request },
  });
});

export const cancelFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  await cancelFriendRequestService(requestId, req.user._id);
  return sendSuccess(res, { message: "Friend request cancelled" });
});

export const getFriends = asyncHandler(async (req, res) => {
  const friends = await getFriendsService(req.user._id);
  return sendSuccess(res, { data: { friends } });
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const { received, sent } = await getPendingRequestsService(req.user._id);
  return sendSuccess(res, { data: { received, sent } });
});

export const unfriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  await unfriendService(req.user._id, friendId);
  return sendSuccess(res, { message: "Unfriended successfully" });
});
