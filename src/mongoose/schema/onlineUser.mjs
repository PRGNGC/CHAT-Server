import mongoose from "mongoose";

const OnlineUserSchema = new mongoose.Schema({
	socketId: { type: mongoose.Schema.Types.String, required: true },
	user: { type: mongoose.Schema.Types.Mixed, required: true },
	rooms: { type: mongoose.Schema.Types.Array, required: true }
});

export const OnlineUser = mongoose.model("OnlineUser", OnlineUserSchema);
