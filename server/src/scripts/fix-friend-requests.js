import "dotenv/config";
import mongoose from "mongoose";
import FriendRequest from "../models/friendRequest.model.js";

await mongoose.connect(process.env.MONGODB_URI);

// Tìm tất cả accepted requests và log ra
const accepted = await FriendRequest.find({ status: "accepted" });
console.log(`Found ${accepted.length} accepted requests`);

// Nếu muốn reset tất cả (dùng để test):
// await FriendRequest.updateMany({}, { status: 'cancelled' });

process.exit(0);
