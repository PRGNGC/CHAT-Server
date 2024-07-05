import { Router } from "express";
import { User } from "../mongoose/schema/user.mjs";

const router = new Router();

router.get("/api/dms/get", async (req, res) => {
	console.log("dms");
	const allDms = await User.find({});

	const limit = 10;
	const { page } = req.query;
	const { search } = req.query;

	let dmsToReturn = [];
	let hasMore = true;
	for (let i = (page - 1) * limit; i <= allDms.length - 1; i++) {
		if (dmsToReturn.length < 10) {
			dmsToReturn.push(allDms[i]);
		}
	}

	if (search !== undefined) {
		dmsToReturn = [];
		for (let i = (page - 1) * limit; i <= allDms.length - 1; i++) {
			if (dmsToReturn.length < 10 && allDms[i].name.includes(search)) {
				dmsToReturn.push(allDms[i]);
			}
		}
	}

	if (dmsToReturn.length < 10) {
		hasMore = false;
	}

	return res.status(200).send({ dms: dmsToReturn, hasMore: hasMore });
});

export default router;
