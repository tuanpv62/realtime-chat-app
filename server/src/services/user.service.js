import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

// ── Get User Profile ──────────────────────────────────────────────
export const getUserProfileService = async (userId, requesterId) => {
  const user = await User.findById(userId).select(
    "username displayName avatar bio isOnline lastSeen createdAt",
  );

  if (!user) throw new AppError("User not found", 404);

  // Tính relationship với requester
  if (requesterId && requesterId.toString() !== userId.toString()) {
    const FriendRequest = (await import("../models/friendRequest.model.js"))
      .default;

    const friendReq = await FriendRequest.findOne({
      $or: [
        { sender: requesterId, receiver: userId },
        { sender: userId, receiver: requesterId },
      ],
    }).select("status sender");

    let relationshipStatus = "none";
    let requestId = null;

    if (friendReq) {
      requestId = friendReq._id;
      if (friendReq.status === "accepted") {
        relationshipStatus = "friends";
      } else if (friendReq.status === "pending") {
        const isSender = friendReq.sender.toString() === requesterId.toString();
        relationshipStatus = isSender ? "request_sent" : "request_received";
      }
    }

    return { ...user.toJSON(), relationshipStatus, requestId };
  }

  return user.toJSON();
};

// ── Update Profile ────────────────────────────────────────────────
export const updateProfileService = async (userId, updates) => {
  const allowed = ["displayName", "bio"];
  const filtered = {};

  allowed.forEach((key) => {
    if (updates[key] !== undefined) {
      filtered[key] = updates[key];
    }
  });

  // Validate
  if (filtered.displayName !== undefined) {
    if (filtered.displayName.length > 50) {
      throw new AppError("Display name must not exceed 50 characters", 400);
    }
    if (filtered.displayName.trim().length === 0) {
      throw new AppError("Display name cannot be empty", 400);
    }
    filtered.displayName = filtered.displayName.trim();
  }

  if (filtered.bio !== undefined && filtered.bio.length > 200) {
    throw new AppError("Bio must not exceed 200 characters", 400);
  }

  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError("User not found", 404);
  return user;
};

// ── Upload Avatar ─────────────────────────────────────────────────
export const uploadAvatarService = async (userId, fileBuffer) => {
  if (!fileBuffer) throw new AppError("No file provided", 400);

  // Lấy public_id cũ để xóa
  const user = await User.findById(userId).select("avatar");
  const oldAvatarPublicId = user?.avatar ? extractPublicId(user.avatar) : null;

  // Upload lên Cloudinary
  const result = await uploadToCloudinary(fileBuffer, {
    folder: "realtime-chat/avatars",
    public_id: `avatar_${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  // Update DB
  const updated = await User.findByIdAndUpdate(
    userId,
    { avatar: result.secure_url },
    { new: true },
  );

  // Xóa ảnh cũ nếu khác public_id (Cloudinary auto overwrite nên không cần)
  // Nhưng nếu user từng upload ở folder khác → xóa
  if (oldAvatarPublicId && !oldAvatarPublicId.includes(`avatar_${userId}`)) {
    await deleteFromCloudinary(oldAvatarPublicId);
  }

  return updated;
};

// ── Upload Message Attachments ────────────────────────────────────
export const uploadAttachmentsService = async (files) => {
  if (!files || files.length === 0)
    throw new AppError("No files provided", 400);

  const uploads = await Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "realtime-chat/attachments",
        resource_type: "auto",
        transformation: file.mimetype.startsWith("image/")
          ? [{ quality: "auto", fetch_format: "auto" }]
          : undefined,
      });

      return {
        url: result.secure_url,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        width: result.width || null,
        height: result.height || null,
      };
    }),
  );

  return uploads;
};

// ── Change Password ───────────────────────────────────────────────
export const changePasswordService = async (
  userId,
  { currentPassword, newPassword },
) => {
  if (!currentPassword || !newPassword) {
    throw new AppError("Both current and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  user.password = newPassword;
  // Invalidate all refresh tokens sau khi đổi password
  user.refreshToken = null;
  await user.save();

  return { message: "Password changed successfully" };
};

// Helper: Extract Cloudinary public_id từ URL
function extractPublicId(url) {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const publicIdWithFolder = parts.slice(-3).join("/").split(".")[0];
    return publicIdWithFolder;
  } catch {
    return null;
  }
}
