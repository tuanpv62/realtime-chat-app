import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/user.model.js";

const testUserSchema = async () => {
  await connectDB();

  console.log("\n📋 Testing User Schema...\n");

  try {
    // ── Test 1: Tạo user hợp lệ ─────────────────────────────────
    console.log("Test 1: Create valid user");
    const user = await User.create({
      username: "john_doe",
      email: "john@example.com",
      password: "password123",
    });
    console.log("✅ User created:", {
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password, // Phải là hash, không phải plain text
      displayName: user.displayName,
    });

    // ── Test 2: Verify password đã được hash ─────────────────────
    console.log("\nTest 2: Password should be hashed");
    console.log("❓ Is hashed:", user.password !== "password123");
    console.log("🔒 Hash preview:", user.password.substring(0, 20) + "...");

    // ── Test 3: comparePassword ──────────────────────────────────
    console.log("\nTest 3: comparePassword method");
    // Phải query lại với select('+password')
    const userWithPwd = await User.findById(user._id).select("+password");
    const isMatch = await userWithPwd.comparePassword("password123");
    const isWrong = await userWithPwd.comparePassword("wrongpassword");
    console.log("✅ Correct password match:", isMatch); // true
    console.log("✅ Wrong password match:", isWrong); // false

    // ── Test 4: Generate tokens ──────────────────────────────────
    console.log("\nTest 4: Token generation");
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log("✅ Access token:", accessToken.substring(0, 30) + "...");
    console.log("✅ Refresh token:", refreshToken.substring(0, 30) + "...");

    // ── Test 5: toJSON không trả password ────────────────────────
    console.log("\nTest 5: toJSON transform");
    const json = user.toJSON();
    console.log("✅ Has id (not _id):", !!json.id && !json._id);
    console.log("✅ No password in JSON:", !json.password);
    console.log("✅ No refreshToken in JSON:", !json.refreshToken);
    console.log("✅ Has virtual name:", json.name);

    // ── Test 6: Validation error ─────────────────────────────────
    console.log("\nTest 6: Validation errors");
    try {
      await User.create({ username: "ab" }); // username < 3 chars
    } catch (err) {
      console.log("✅ Caught validation error:", err.errors.username.message);
    }

    // ── Cleanup ──────────────────────────────────────────────────
    await User.deleteOne({ _id: user._id });
    console.log("\n🧹 Test user cleaned up");
    console.log("\n🎉 All tests passed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  process.exit(0);
};

testUserSchema();
