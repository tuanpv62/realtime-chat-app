import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/app.config.js";

// ─── Constants ───────────────────────────────────────────────────
const SALT_ROUNDS = 12;
// Salt rounds = 12: Cân bằng giữa security và performance
// 10 = ~100ms, 12 = ~400ms, 14 = ~1.5s per hash
// 12 là sweet spot cho production (đủ chậm để brute force khó, đủ nhanh cho UX)

// ─── Schema Definition ───────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      // trim: Tự động xóa khoảng trắng đầu/cuối
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must not exceed 30 characters"],
      // Chỉ cho phép chữ, số, dấu gạch dưới
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
      lowercase: true,
      // lowercase: true → Tự động chuyển thành chữ thường
      // "John_Doe" → "john_doe" — Tránh trùng lặp do case
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // select: false — Cực kỳ quan trọng!
      // Mặc định KHÔNG trả password trong mọi query
      // Phải explicitly dùng .select('+password') khi cần so sánh
      select: false,
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: [50, "Display name must not exceed 50 characters"],
      // Nếu không cung cấp → dùng username
      default: null,
    },

    avatar: {
      type: String,
      default: null,
      // Sẽ lưu URL của ảnh (Cloudinary, S3...)
    },

    bio: {
      type: String,
      maxlength: [200, "Bio must not exceed 200 characters"],
      default: "",
    },

    // Lưu refresh token để có thể revoke (đăng xuất)
    // Khi signout → set refreshToken = null
    // Khi verify → check token trong DB có khớp không
    refreshToken: {
      type: String,
      default: null,
      select: false, // Không bao giờ trả ra ngoài
    },

    // Online status — Sẽ update qua Socket.IO ở phần sau
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    // Dùng cho verify email sau này (bước mở rộng)
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    // timestamps: true → Tự động thêm createdAt và updatedAt
    timestamps: true,

    // toJSON: Kiểm soát data khi convert sang JSON (res.json())
    toJSON: {
      virtuals: true, // Include virtual fields
      transform(doc, ret) {
        // Xóa các field nhạy cảm trước khi trả về client
        // Dù select: false đã ẩn, nhưng đây là lớp bảo vệ thứ 2
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        // Thêm id field (thay cho _id dài dòng)
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  },
);

// ─── Virtuals ────────────────────────────────────────────────────
// Virtual field: Không lưu vào DB, tính toán khi query
// displayName hiển thị: Dùng displayName nếu có, không thì dùng username
userSchema.virtual("name").get(function () {
  return this.displayName || this.username;
});

// ─── Indexes ─────────────────────────────────────────────────────
// Index giúp query nhanh hơn đáng kể
// email và username đã có unique: true → tự tạo index
// Thêm index cho các field hay được query
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });

// ─── Pre-save Middleware ──────────────────────────────────────────
// Chạy tự động TRƯỚC KHI lưu document vào DB
// isModified('password'): Chỉ hash khi password thay đổi
// Tránh hash lại password đã hash khi update field khác (ví dụ: bio)
// userSchema.pre("save", async function (next) {
//   // 'this' = document đang được save
//   if (!this.isModified("password")) {
//     return next(); // Bỏ qua nếu password không thay đổi
//   }

//   try {
//     // Tạo salt và hash password
//     const salt = await bcrypt.genSalt(SALT_ROUNDS);
//     this.password = await bcrypt.hash(this.password, salt);

//     // Set displayName mặc định bằng username khi tạo mới
//     if (this.isNew && !this.displayName) {
//       this.displayName = this.username;
//     }

//     next();
//   } catch (error) {
//     next(error); // Truyền lỗi cho Express error handler
//   }
// });
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);

  if (this.isNew && !this.displayName) {
    this.displayName = this.username;
  }
});

// ─── Instance Methods ─────────────────────────────────────────────
// Methods gắn trên từng document (instance)
// Gọi: const user = await User.findOne(...); user.comparePassword(...)

// So sánh password người dùng nhập với hash trong DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Lưu ý: 'this.password' có thể undefined nếu không select('+password')
  // Phải query với: User.findOne({...}).select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

// Tạo JWT Access Token (ngắn hạn)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      // Payload: Thông tin nhúng vào token
      userId: this._id,
      username: this.username,
      email: this.email,
    },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      // issuer: Ai tạo ra token (optional nhưng good practice)
      issuer: "realtime-chat-app",
    },
  );
};

// Tạo JWT Refresh Token (dài hạn)
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      // Payload refresh token nên tối giản
      // Chỉ cần userId để lookup trong DB
      userId: this._id,
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: "realtime-chat-app",
    },
  );
};

// ─── Static Methods ───────────────────────────────────────────────
// Methods gắn trên Model (class), không phải instance
// Gọi: User.findByEmail('test@test.com')

// Tìm user theo email (dùng nhiều lần trong auth flow)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Tìm user theo username
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username.toLowerCase().trim() });
};

// ─── Model Export ─────────────────────────────────────────────────
const User = mongoose.model("User", userSchema);

export default User;
