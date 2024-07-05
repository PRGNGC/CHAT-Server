import mongoose from "mongoose";

const DmsSchema = new mongoose.Schema({
	type: { type: mongoose.Schema.Types.String, required: true },
	id: { type: mongoose.Schema.Types.String, required: true },
	messages: { type: mongoose.Schema.Types.Mixed, required: true },
	firstUser: { type: mongoose.Schema.Types.Mixed, required: true },
	secondUser: { type: mongoose.Schema.Types.Mixed, required: true }
});

export const Dms = mongoose.model("Dms", DmsSchema);
