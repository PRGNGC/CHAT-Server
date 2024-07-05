import { Router } from "express";
import { Channels } from "../mongoose/schema/channel.mjs";
import { Dms } from "../mongoose/schema/dms.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { checkTokens } from "../middleware/checkTokens.mjs";
import { renewTokens } from "../middleware/renewTokens.mjs";
import jwt from "jsonwebtoken";

const router = new Router();

router.get("/api/user/get", checkTokens, renewTokens, async (req, res) => {
	console.log("in user");
	if (res.locals.restart) {
		res.clearCookie("refreshToken");
		return res.sendStatus(440);
	}

	if (res.locals.login) {
		return res.sendStatus(401);
	}

	const accessToken = res.locals.refresh
		? res.locals.newAccessToken
		: req.headers.authorization.split(" ")[1];
	const refreshToken = res.locals.refresh
		? res.locals.newRefreshToken
		: req.headers.cookie.split("=")[1];

	const accessTokenInfo = jwt.verify(
		accessToken,
		process.env.ACCESS_SIGNATURE_SECRET
	);

	const userLogin = accessTokenInfo.login;

	const user = await User.findOne({ login: userLogin });
	console.log("router.get ~ user:", user);

	const allChannels = await Channels.find({});
	const channels = allChannels.filter((channel) =>
		user.channels.includes(channel.id)
	);

	const allDms = await Dms.find({});
	const dms = allDms.filter((dm) => user.dms.includes(dm.id));

	res.status(201).send({
		user: {
			name: user.name,
			username: user.username,
			userId: user.userId,
			userImg: user.userImg,
			channels: channels,
			dms: dms,
			status: user.status
		}
	});
});

export default router;
