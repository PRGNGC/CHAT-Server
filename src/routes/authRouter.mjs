import { Router } from "express";
import { User } from "../mongoose/schema/user.mjs";
import { getTokens, refreshTokenAge } from "../utils/getTokens.mjs";
import jwt from "jsonwebtoken";
import { avatarBuffer, coverBuffer } from "../utils/bufferImgs.mjs";
import { v4 as uuidv4, v6 as uuidv6 } from "uuid";
import multer from "multer";
import { Channels } from "../mongoose/schema/channel.mjs";
import { Dms } from "../mongoose/schema/dms.mjs";

const router = new Router();
const upload = multer();

router.post("/api/auth/login", async (req, res) => {
	const { login, password } = req.body;

	const user = await User.findOne({ login: login });

	if (!user) {
		return res.status(404).send({ msg: "User not registered" });
	}

	if (user.password !== password) {
		return res.status(400).send({ msg: "Incorrect credentials" });
	}

	const { accessToken, refreshToken } = getTokens(login);

	const userObj = jwt.verify(accessToken, process.env.ACCESS_SIGNATURE_SECRET);
	const expTime = userObj.exp;

	res.cookie("refreshToken", refreshToken, {
		maxAge: refreshTokenAge,
		httpOnly: true
	});

	const allChannels = await Channels.find({});
	const channels = allChannels.filter((channel) =>
		user.channels.includes(channel.id)
	);

	const allDms = await Dms.find({});
	const dms = allDms.filter((dm) => user.dms.includes(dm.id));

	res.status(201).send({
		accessToken,
		user: {
			name: user.name,
			username: user.username,
			userId: user.userId,
			userImg: user.userImg,
			channels: channels,
			dms: dms,
			status: user.status,
			notifications: user.notifications
		}
	});
});

router.post("/api/auth/logout", (req, res) => {
	res.clearCookie("refreshToken");
	return res.sendStatus(200);
});

router.post("/api/auth/signup", upload.single("img"), async (req, res) => {
	const userImg = req.file;
	const { login, password, status, name } = req.body;

	const isSuchLoginExists = await User.findOne({ login: login });
	if (isSuchLoginExists) {
		return res.status(400).send({ msg: "Login already exists" });
	}

	const newUser = await User({
		login: login,
		password: password,
		userImg: Buffer.from(userImg.buffer).toString("base64"),
		userId: uuidv6(),
		name: name,
		username: `@${name.toLowerCase().split(" ").join("")}`,
		status: status,
		channels: [],
		dms: []
	});

	await newUser.save();

	const user = {
		name,
		username: `@${name.toLowerCase().split(" ").join("")}`,
		userId: uuidv6(),
		userImg: Buffer.from(userImg.buffer).toString("base64"),
		status,
		channels: [],
		dms: []
	};

	const { accessToken, refreshToken } = getTokens(login);

	res.cookie("refreshToken", refreshToken, {
		maxAge: refreshTokenAge,
		httpOnly: true
	});

	res.status(201).send({ accessToken, user });
});

export default router;
