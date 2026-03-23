import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
  getUserProfileService,
  updateProfileService,
  uploadAvatarService,
  uploadAttachmentsService,
  changePasswordService,
} from "../services/user.service.js";

// GET /users/:userId — Public profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await getUserProfileService(req.params.userId, req.user?._id);
  return sendSuccess(res, { data: { user: profile } });
});

// PATCH /users/me — Update own profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateProfileService(req.user._id, req.body);
  return sendSuccess(res, {
    message: "Profile updated successfully",
    data: { user },
  });
});

// POST /users/me/avatar — Upload avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  const user = await uploadAvatarService(req.user._id, req.file.buffer);

  // Emit socket event để update avatar realtime
  const io = req.app.get("io");
  if (io) {
    const { userSocketMap } = await import("../socket/socket.js");
    // Notify tất cả conversations mà user này tham gia
    const Conversation = (await import("../models/conversation.model.js"))
      .default;
    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select("_id");

    conversations.forEach((conv) => {
      io.to(conv._id.toString()).emit("user:avatarUpdated", {
        userId: req.user._id.toString(),
        avatar: user.avatar,
      });
    });
  }

  return sendSuccess(res, {
    message: "Avatar uploaded successfully",
    data: { avatar: user.avatar, user },
  });
});

// POST /users/upload-attachments — Upload file attachments
export const uploadAttachments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No files uploaded" });
  }

  const attachments = await uploadAttachmentsService(req.files);
  return sendSuccess(res, {
    statusCode: 201,
    message: "Files uploaded successfully",
    data: { attachments },
  });
});

// PATCH /users/me/password — Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await changePasswordService(req.user._id, {
    currentPassword,
    newPassword,
  });

  // Clear refresh token cookie (force re-login)
  const { getClearCookieOptions } = await import("../services/auth.service.js");
  res.clearCookie("refreshToken", getClearCookieOptions());

  return sendSuccess(res, result);
});
