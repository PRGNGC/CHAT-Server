import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
	login: { type: mongoose.Schema.Types.String, required: true, unique: true },
	password: {
		type: mongoose.Schema.Types.String,
		required: true,
		unique: true
	},
	name: { type: mongoose.Schema.Types.String, required: true },
	username: { type: mongoose.Schema.Types.String, required: true },
	userId: { type: mongoose.Schema.Types.String, required: true },
	userImg: { type: mongoose.Schema.Types.String, required: true },
	status: { type: mongoose.Schema.Types.String, required: true },
	channels: { type: mongoose.Schema.Types.Array, required: true },
	dms: { type: mongoose.Schema.Types.Array, required: true },
	notifications: { type: mongoose.Schema.Types.Array, required: true }
});

export const User = mongoose.model("User", UserSchema);
