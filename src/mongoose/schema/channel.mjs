import mongoose from "mongoose";

const ChannelsSchema = new mongoose.Schema({
	name: { type: mongoose.Schema.Types.String, required: true },
	id: { type: mongoose.Schema.Types.String, required: true },
	messages: { type: mongoose.Schema.Types.Mixed, required: true },
	participants: { type: mongoose.Schema.Types.Mixed, required: true },
	type: { type: mongoose.Schema.Types.String, required: true },
	availability: { type: mongoose.Schema.Types.String, required: true },
	admin: { type: mongoose.Schema.Types.String, required: true },
	description: { type: mongoose.Schema.Types.String, required: true }
});

export const Channels = mongoose.model("Channels", ChannelsSchema);
