import { Router } from "express";
import { Channels } from "../mongoose/schema/channel.mjs";

const router = new Router();

router.get("/api/channels/get", async (req, res) => {
	const allChannels = await Channels.find({});
	const limit = 10;
	const { page } = req.query;
	const { search } = req.query;

	let channelsToReturn = [];
	let hasMore = true;
	for (let i = (page - 1) * limit; i <= allChannels.length - 1; i++) {
		if (channelsToReturn.length < 10) {
			channelsToReturn.push(allChannels[i]);
		}
	}

	if (search !== undefined) {
		channelsToReturn = [];
		for (let i = (page - 1) * limit; i <= allChannels.length - 1; i++) {
			if (
				channelsToReturn.length < 10 &&
				allChannels[i].name.includes(search)
			) {
				channelsToReturn.push(allChannels[i]);
			}
		}
	}

	if (channelsToReturn.length < 10) {
		hasMore = false;
	}

	return res.status(200).send({ channels: channelsToReturn, hasMore: hasMore });
});

export default router;
