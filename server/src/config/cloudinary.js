import { v2 as cloudinary } from "cloudinary";
// eslint-disable-next-line no-unused-vars
import config from "./app.config.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer stream lên Cloudinary
// Dùng streamifier để convert buffer → stream
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "realtime-chat",
        resource_type: "auto",
        // Giới hạn kích thước ảnh
        transformation: options.transformation || [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    // Import streamifier inline để tránh top-level import issues
    import("streamifier").then(({ default: streamifier }) => {
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};

export default cloudinary;
