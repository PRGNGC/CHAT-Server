import { Router } from "express";
import * as fs from "fs";

const router = new Router();

router.get("/api/file/download", (req, res) => {
	const { filename } = req.query;
	console.log("router.post ~ req.body:", req.query);
	console.log("router.post ~ filename:", filename);

	const buff = fs.readFileSync(`public/${filename}`);
	const base64data = buff.toString("base64");

	return res.status(200).send({ file: base64data });
});

export default router;
