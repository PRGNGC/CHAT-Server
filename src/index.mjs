import { createServer } from "http";
import { Server } from "socket.io";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import authRouter from "./routes/authRouter.mjs";
import channelsRouter from "./routes/channelsRouter.mjs";
import dmsRouter from "./routes/dmsRouter.mjs";
import fileRouter from "./routes/fileRouter.mjs";
import userRouter from "./routes/userRouter.mjs";
import * as fs from "fs";
import { v4 as uuidv4, v6 as uuidv6 } from "uuid";

import { Channels } from "./mongoose/schema/channel.mjs";
import { Dms } from "./mongoose/schema/dms.mjs";
import { User } from "./mongoose/schema/user.mjs";

// websockets controllers
import { applyEnterController } from "./controllers/applyEnterController.mjs";
import { applyResponseController } from "./controllers/applyResponseController.mjs";
import { clearNotificationController } from "./controllers/clearNotificationController.mjs";
import { deleteChannelController } from "./controllers/deleteChannelController.mjs";
import { disconnectController } from "./controllers/disconnectController.mjs";
import { enterChannelController } from "./controllers/enterChannelController.mjs";
import { enterDMController } from "./controllers/enterDMController.mjs";
import { joinRoomController } from "./controllers/joinRoomController.mjs";
import { leaveChannelController } from "./controllers/leaveChannelController.mjs";
import { messageController } from "./controllers/messageController.mjs";
import { newChannelController } from "./controllers/newChannelController.mjs";
import { typingController } from "./controllers/typingController.mjs";

import { enterDMHandler } from "./controllers/enterDMHandler.mjs";
import { joinRoomHandler } from "./controllers/joinRoomHandler.mjs";
import { enterChannelHandler } from "./controllers/enterChannelHandler.mjs";
import { leaveChannelHandler } from "./controllers/leaveChannelHandler.mjs";
import { newChannelHandler } from "./controllers/newChannelHandler.mjs";
import { messageHandler } from "./controllers/messageHandler.mjs";
import { clearNotificationHandler } from "./controllers/clearNotificationHandler.mjs";
import { deleteChannelHandler } from "./controllers/deleteChannelHandler.mjs";
import { applyEnterHandler } from "./controllers/applyEnterHandler.mjs";
import { applyResponseHandler } from "./controllers/applyResponseHandler.mjs";
import { typingHandler } from "./controllers/typingHandler.mjs";
import { disconnectHandler } from "./controllers/disconnectHandler.mjs";

// rest api
const app = express();

app.use(express.json());
app.use(
	express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 50000 })
);

app.use(
	cors({
		origin: "http://localhost:5173",
		methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
		credentials: true
	})
);
app.use(cookieParser());
app.use(express.static("public"));
mongoose
	.connect(
		"mongodb+srv://prgngc:www@cluster0.wdmwgw4.mongodb.net/chatBd?retryWrites=true&w=majority&appName=Cluster0"
	)
	.then(() => console.log("DB launched successfully"))
	.catch((e) => console.log(e));

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => console.log("Server launched successfully"));

app.use(authRouter);
app.use(channelsRouter);
app.use(dmsRouter);
app.use(fileRouter);
app.use(userRouter);

// websockets
const httpServer = createServer();

const io = new Server(httpServer, {
	maxHttpBufferSize: 1e8,
	cors: {
		origin: "http://localhost:5173"
	}
});

let onlineUsers = [];

io.on("connection", (socket) => {
	console.log(`User ${socket.id} connected`);

	// // joinRoomController(socket, io);
	// socket.on("join rooms", ({ rooms, user }) =>
	// 	joinRoomHandler({ rooms, user }, io, socket)
	// );

	socket.on("join rooms", ({ rooms, user }) => {
		rooms.map((room) => socket.join(room));

		rooms.map((room) => {
			socket.broadcast.to(room).emit("online", {
				status: true,
				user: user
			});
		});

		for (let i = 0; i < onlineUsers.length; i++) {
			const commonElements = onlineUsers[i].rooms.filter((elem) =>
				rooms.includes(elem)
			);
			// console.log("socket.on ~ commonElements:", commonElements);
			// console.log("socket.on ~ commonElements.length:", commonElements.length);

			if (commonElements.length !== 0) {
				// console.log("in online");

				commonElements.map((room) => {
					// console.log("commonElements.map ~ room:", room);
					// console.log(
					// 	"socket.broadcast.to ~ onlineUsers[i].user:",
					// 	onlineUsers[i].user
					// );
					io.to(room).emit("online", {
						status: true,
						user: onlineUsers[i].user
					});
				});
			}
		}

		// console.log("before socket.on ~ onlineUsers:", onlineUsers);
		onlineUsers.push({
			socketId: socket.id,
			user: user,
			rooms: rooms
			// socketObj: socket
		});
		// console.log("after socket.on ~ onlineUsers:", onlineUsers);
		console.log("onlineUsers", onlineUsers);
	});

	// // enterChannelController(socket, io);
	// socket.on("enter channel", async ({ room, user }) =>
	// 	enterChannelHandler({ room, user }, io, socket)
	// );

	socket.on("enter_channel", async ({ room, user }) => {
		console.log("in");
		console.log("socket.on ~ user:", user);
		console.log("socket.on ~ room:", room);
		await User.updateOne(
			{ userId: user.userId },
			{
				$push: { channels: room }
			}
		);

		const enterMsg = {
			type: "enter",
			userName: user.name,
			userId: user.userId
		};

		await Channels.updateOne(
			{ id: room },
			{
				$push: { messages: enterMsg }
			}
		);

		let thisUserFromBD = await User.findOne({ userId: user.userId });

		await Channels.updateOne(
			{ id: room },
			{
				$push: {
					participants: {
						userId: user.userId,
						userImg: user.userImg,
						name: user.name,
						login: thisUserFromBD.login,
						otherAccounts: thisUserFromBD.otherAccounts
					}
				}
			}
		);

		let userIndex = -2;
		onlineUsers.filter((userr, index) => {
			if (userr.socketId === socket.id) {
				userIndex = index;
			}
		});
		if (userIndex !== -2) {
			onlineUsers[userIndex].rooms.push(room);
		}

		socket.join(room);

		io.to(room).emit("message", {
			message: enterMsg,
			messageOrigin: room
		});

		// исправление проблемы: "добавить в обработчик enterChannel отсылку "online""
		// socket.broadcast.to(room).emit("online", {
		// status: true,
		// user: user
		// });
	});

	// // leaveChannelController(socket, io);
	// socket.on("leave channel", async ({ room, user }) =>
	// 	leaveChannelHandler({ room, user }, io, socket)
	// );

	socket.on("leave channel", async ({ room, user }) => {
		const leaveMsg = {
			type: "leave",
			userName: user.name,
			userId: user.userId
		};

		await Channels.updateOne(
			{ id: room },
			{
				$push: { messages: leaveMsg }
			}
		);

		await User.updateOne(
			{ userId: user.userId },
			{
				$pull: { channels: room }
			}
		);

		await Channels.updateOne(
			{ id: room },
			{
				$pull: {
					participants: {
						userId: user.userId
					}
				}
			}
		);

		let userIndex = -2;
		onlineUsers.filter((userr, index) => {
			if (userr.socketId === socket.id) {
				userIndex = index;
			}
		});

		let roomIndex = -2;
		onlineUsers[userIndex].rooms.filter((roomm, index) => {
			if (room === roomm) {
				roomIndex = index;
			}
		});

		onlineUsers[userIndex].rooms.splice(roomIndex, 1);

		socket.leave(room);

		io.to(room).emit("message", {
			message: leaveMsg,
			messageOrigin: room
		});
	});

	// socket.on("enter dm", enterDMHandler);

	// // enterDMController(socket, io);
	// socket.on(
	// 	"enter dm",
	// 	async ({ initiatorUser, secondUser, roomClient, firstUser }) =>
	// 		enterDMHandler(
	// 			{ initiatorUser, secondUser, roomClient, firstUser },
	// 			io,
	// 			socket
	// 		)
	// );

	socket.on(
		"enter dm",
		// async ({ initiatorUser, secondUser, roomClient, firstUser }) => {
		async ({ initiatorUser, secondUser }) => {
			// создание кода для новой комнаты
			const room = initiatorUser.userId + secondUser.userId;

			// добавление инициатору новой dm в список dm новую dm
			await User.updateOne(
				{ userId: initiatorUser.userId },
				{
					$push: { dms: room }
				}
			);

			// добавление второму пользователю новой dm в список dm новую dm
			await User.updateOne(
				{ userId: secondUser.userId },
				{
					$push: { dms: room }
				}
			);

			// создание объекта новой dm
			const newDm = await Dms({
				type: "dm",
				id: room,
				messages: [],
				firstUser: initiatorUser,
				secondUser: secondUser
			});

			// определение находится ли инициатор сейчас онлайн
			let initiatorUserIndex = -2;
			onlineUsers.filter((userr, index) => {
				if (userr.socketId === socket.id) {
					initiatorUserIndex = index;
				}
			});

			// подключение инициатора (если он онлайн) к новой беседе
			if (initiatorUserIndex !== -2) {
				onlineUsers[initiatorUserIndex].rooms.push(room);
			}
			socket.join(room);

			// определение находится ли второй пользователь сейчас онлайн
			let secondUserIndex = -2;
			let secondUserSocketId = "";
			onlineUsers.filter((userr, index) => {
				if (userr.user === secondUser.userId) {
					secondUserIndex = index;
					// получение id сокета второго пользователя
					secondUserSocketId = userr.socketId;
				}
			});

			// если второй пользователь онлайн - подключить к новой беседе
			if (secondUserIndex !== -2) {
				// получение сокета второго пользователя
				const secondUserSocketObj = io.sockets.sockets.get(secondUserSocketId);
				onlineUsers[secondUserIndex].rooms.push(room);
				secondUserSocketObj.join(room);
			}

			// отправка новой dm всем кто в комнате
			io.to(room).emit("new dm", { newDm: newDm });

			// сохранение объекта новой dm в базе данных (сделать это в конце)
			await newDm.save();

			// // создание кода для новой комнаты
			// const room = initiatorUser.userId + secondUser.userId;

			// if (initiatorUser) {
			// 	// добавление инициатору новой dm в список dm новую dm
			// 	await User.updateOne(
			// 		{ userId: initiatorUser.userId },
			// 		{
			// 			$push: { dms: room }
			// 		}
			// 	);

			// 	// определение находится ли инициатор сейчас онлайн
			// 	let initiatorUserIndex = -2;
			// 	onlineUsers.filter((userr, index) => {
			// 		if (userr.socketId === socket.id) {
			// 			initiatorUserIndex = index;
			// 		}
			// 	});

			// 	// подключение инициатора (если он онлайн) к новой беседе
			// 	if (initiatorUserIndex !== -2) {
			// 		onlineUsers[initiatorUserIndex].rooms.push(room);
			// 	}
			// 	socket.join(room);

			// 	// определение находится ли второй пользователь сейчас онлайн
			// 	let secondUserOnline = onlineUsers.filter(
			// 		(user) => user.user === secondUser.userId
			// 	);

			// 	// если второй пользователь не онлайн
			// 	if (secondUserOnline.length === 0) {
			// 		// добавление второму пользователю новой dm в список dm новую dm
			// 		await User.updateOne(
			// 			{ userId: secondUser.userId },
			// 			{
			// 				$push: { dms: room }
			// 			}
			// 		);

			// 		// создание объекта новой dm
			// 		const newDm = await Dms({
			// 			type: "dm",
			// 			id: room,
			// 			messages: [],
			// 			firstUser: initiatorUser,
			// 			secondUser: secondUser
			// 		});

			// 		// отправка новой dm всем
			// 		socket.emit("new dm", { newDm: newDm });

			// 		// сохранение объекта новой dm в базе данных
			// 		await newDm.save();
			// 		return;
			// 	}

			// 	// если второй пользователь онлайн
			// 	if (secondUserOnline.length >= 1) {
			// 		socket
			// 			.to(secondUserOnline[0].socketId)
			// 			.emit("enter dm", { room: room, firstUser: initiatorUser });
			// 		return;
			// 	}
			// }

			// // добавление второму пользователю новой dm в список dm новую dm
			// await User.updateOne(
			// 	{ userId: secondUser.userId },
			// 	{
			// 		// $push: { dms: roomClient }
			// 		$push: { dms: room }
			// 	}
			// );

			// // определение находится ли второй пользователь сейчас онлайн
			// let secondUserIndex = -2;
			// onlineUsers.filter((userr, index) => {
			// 	if (userr.socketId === socket.id) {
			// 		secondUserIndex = index;
			// 	}
			// });

			// // если второй пользователь онлайн - подключить к новой беседе
			// if (secondUserIndex !== -2) {
			// 	onlineUsers[secondUserIndex].rooms.push(roomClient);
			// }
			// socket.join(roomClient);

			// // создание объекта новой dm
			// const newDm = await Dms({
			// 	type: "dm",
			// 	// id: roomClient,
			// 	id: room,
			// 	messages: [],
			// 	// firstUser: firstUser,
			// 	firstUser: initiatorUser,
			// 	secondUser: secondUser
			// });

			// // отправка новой dm всем кто в комнате
			// io.to(roomClient).emit("new dm", { newDm: newDm });

			// // сохранение объекта новой dm в базе данных
			// await newDm.save();
		}
	);

	// // newChannelController(socket, io);
	// socket.on(
	// 	"new channel",
	// 	async ({ name, accessability, description, admin }) =>
	// 		newChannelHandler({ name, accessability, description, admin }, io, socket)
	// );

	socket.on(
		"new channel",
		async ({ name, accessability, description, admin }) => {
			console.log("admin", admin);

			const newRoom = uuidv6();

			console.log("in new channel");

			await User.updateOne(
				{ userId: admin.userId },
				{
					$push: { channels: newRoom }
				}
			);

			let adminIndex = -2;
			onlineUsers.filter((userr, index) => {
				if (userr.socketId === socket.id) {
					adminIndex = index;
				}
			});
			if (adminIndex !== -2) {
				onlineUsers[adminIndex].rooms.push(newRoom);
			}

			socket.join(newRoom);

			const newChannel = await Channels({
				name: name,
				id: newRoom,
				messages: [
					{
						content: `${admin.name} создал(а) группу`,
						userId: admin.userId,
						type: "create"
					}
				],
				// participants: [admin],
				participants: [
					{
						userId: admin.userId,
						userImg: admin.userImg,
						name: admin.name,
						login: admin.login,
						otherAccounts: admin.otherAccounts
					}
				],
				type: "channel",
				availability: accessability,
				admin: admin.userId,
				description: description
			});
			await newChannel.save();

			io.emit("new channel", { admin: admin, newChannel: newChannel });
		}
	);

	// // messageController(socket, io);
	// socket.on("message", async ({ messageOrigin, message, room, type }) =>
	// 	messageHandler({ messageOrigin, message, room, type }, io, socket)
	// );

	socket.on("message", async ({ messageOrigin, message, room, type }) => {
		console.log("here");
		console.log("message", message);
		if (message.filesInfo) {
			message.filesInfo.map((file) => {
				console.log(file);
				const filee = file.file;
				const fileBase64 = Buffer.from(filee, "base64");
				fs.writeFileSync(`public/${file.name}.${file.extension}`, fileBase64);
			});

			const imgExtensions = ["svg", "png", "jpg", "jpeg"];

			message.filesInfo = message.filesInfo.map((file) => {
				if (imgExtensions.includes(file.extension)) {
					return {
						name: file.name,
						extension: file.extension,
						type: file.type,
						url: `http://localhost:3500/${file.name}.${file.extension}`
					};
				}
				return {
					name: file.name,
					extension: file.extension,
					type: file.type
				};
			});
		}

		const allUsers = await User.find({});

		if (type === "channel") {
			await Channels.updateOne(
				{ id: messageOrigin },
				{
					$push: { messages: message }
				}
			);

			// console.log("allUsers", allUsers);
			// console.log("onlineUsers", onlineUsers);

			allUsers.map(async (user) => {
				if (!user.channels.includes(room)) {
					return;
				}

				const userInOnline = onlineUsers.filter(
					(onlineUser) => onlineUser.user === user.userId
				);

				console.log("userInOnline", userInOnline);

				if (userInOnline.length === 0) {
					const userObj = await User.findOne({ userId: user.userId });

					if (userObj.notifications.length === 0) {
						await User.updateOne(
							{ userId: user.userId },
							{
								$push: {
									notifications: {
										type: "unreadMessage",
										room: room,
										// chatName: "",
										count: 1,
										firstUnreadMessage: message
									}
								}
							}
						);
						return;
					}

					let notificationForRoomIndex = -2;
					userObj.notifications.map((notification, index) => {
						if (notification.room === room) {
							notificationForRoomIndex = index;
						}
					});

					if (notificationForRoomIndex !== -2) {
						await User.updateOne(
							{ userId: user.userId },
							{
								$pull: {
									notifications: {
										room: room
									}
								}
							}
						);

						await User.updateOne(
							{ userId: user.userId },
							{
								$push: {
									notifications: {
										type: "unreadMessage",
										room: room,
										count:
											userObj.notifications[notificationForRoomIndex].count + 1,
										firstUnreadMessage:
											userObj.notifications[notificationForRoomIndex]
												.firstUnreadMessage
									}
								}
							}
						);

						return;
					}

					await User.updateOne(
						{ userId: user.userId },
						{
							$push: {
								notifications: {
									type: "unreadMessage",
									room: room,
									count: 1,
									firstUnreadMessage: message
								}
							}
						}
					);
				}
			});

			// regionStart: отправка уведомлений о сообщениях на старых аккаунтах
			let targetChannel = await Channels.findOne({ id: messageOrigin });

			for (let i = 0; i < targetChannel.participants.length; i++) {
				// console.log("in");
				for (
					let j = 0;
					j < targetChannel.participants[i].otherAccounts.length;
					j++
				) {
					// console.log("in2");
					await User.updateOne(
						{ userId: targetChannel.participants[i].otherAccounts[j] },
						{
							$push: {
								notifications: {
									type: "outerMessage",
									account: targetChannel.participants[i].login,
									count: 1
								}
							}
						}
					);
				}
			}
			// regionEnd: отправка уведомлений о сообщениях на старых аккаунтах
		}

		if (type === "dm") {
			await Dms.updateOne(
				{ id: messageOrigin },
				{
					$push: { messages: message }
				}
			);

			allUsers.map(async (user) => {
				if (!user.dms.includes(room)) {
					return;
				}

				const userInOnline = onlineUsers.filter(
					(onlineUser) => onlineUser.user === user.userId
				);

				if (userInOnline.length === 0) {
					const userObj = await User.findOne({ userId: user.userId });

					if (userObj.notifications.length === 0) {
						await User.updateOne(
							{ userId: user.userId },
							{
								$push: {
									notifications: {
										type: "unreadMessage",
										room: room,
										count: 1,
										firstUnreadMessage: message
									}
								}
							}
						);
						return;
					}

					let notificationForRoomIndex = -2;
					userObj.notifications.map((notification, index) => {
						if (notification.room === room) {
							notificationForRoomIndex = index;
						}
					});

					if (notificationForRoomIndex !== -2) {
						await User.updateOne(
							{ userId: user.userId },
							{
								$pull: {
									notifications: {
										room: room
									}
								}
							}
						);

						await User.updateOne(
							{ userId: user.userId },
							{
								$push: {
									notifications: {
										type: "unreadMessage",
										room: room,
										count:
											userObj.notifications[notificationForRoomIndex].count + 1,
										firstUnreadMessage:
											userObj.notifications[notificationForRoomIndex]
												.firstUnreadMessage
									}
								}
							}
						);

						return;
					}

					await User.updateOne(
						{ userId: user.userId },
						{
							$push: {
								notifications: {
									type: "unreadMessage",
									room: room,
									count: 1,
									firstUnreadMessage: message
								}
							}
						}
					);
				}
			});
		}

		console.log("here");
		console.log("message2");
		io.to(room).emit("message", {
			message: message,
			messageOrigin: messageOrigin
		});
	});

	// // clearNotificationController(socket);
	// socket.on("clear notification", async ({ type, room, user }) =>
	// 	clearNotificationHandler({ type, room, user }, io, socket)
	// );

	socket.on("clear notification", async ({ type, room, user }) => {
		if (type === "unreadMessage") {
			await User.updateOne(
				{
					userId: user.userId
				},
				{ $pull: { notifications: { type: type, room: room } } }
			);
			return;
		}

		if (type === "channelDeletion") {
			// console.log("in");
			// console.log("socket.on ~ user:", user);
			// console.log("socket.on ~ room:", room);
			// console.log("socket.on ~ type:", type);
			await User.updateOne(
				{
					userId: user.userId
				},
				{ $pull: { notifications: { type: type, room: room } } }
			);
			return;
		}

		if (type === "outerMessage") {
			// console.log("in");
			// console.log("socket.on ~ user:", user);
			// console.log("socket.on ~ room:", room);
			// console.log("socket.on ~ type:", type);
			await User.updateOne(
				{
					userId: user.userId
				},
				{ $pull: { notifications: { type: type, room: room } } }
			);
			return;
		}

		if (type === "applyEnterResponse") {
			// console.log("in");
			// console.log("socket.on ~ user:", user);
			// console.log("socket.on ~ room:", room);
			// console.log("socket.on ~ type:", type);
			await User.updateOne(
				{
					userId: user.userId
				},
				{ $pull: { notifications: { type: type, room: room } } }
			);
			return;
		}
	});

	// // deleteChannelController(socket, io);
	// socket.on("delete channel", async ({ channel }) =>
	// 	deleteChannelHandler({ channel }, io, socket)
	// );

	socket.on("delete channel", async ({ channel }) => {
		const channelFromDb = await Channels.findOne({ id: channel.id });

		const usersOfChannel = channelFromDb.participants;

		const admin = await User.findOne({ userId: channelFromDb.admin });

		usersOfChannel.map(async (usersOfChannel) => {
			const channelId = channel.id;
			console.log("usersOfChannel.map ~ channelId:", channelId);
			await User.updateOne(
				{ userId: usersOfChannel.userId },
				{
					$pull: {
						channels: channelId
					}
				}
			);

			if (usersOfChannel.userId !== admin.userId) {
				await User.updateOne(
					{ userId: usersOfChannel.userId },
					{
						$push: {
							notifications: {
								type: "channelDeletion",
								room: channel,
								admin: admin
							}
						}
					}
				);
			}
		});

		io.to(channel.id).emit("delete channel", { admin, channel });

		socket.leave(channel.id);

		await Channels.deleteOne({ id: channel.id });
	});

	// // applyEnterController(socket, io);
	// socket.on("apply enter", async ({ user, channel }) =>
	// 	applyEnterHandler({ user, channel }, io, socket)
	// );

	socket.on("apply enter", async ({ user, channel }) => {
		const channelFromDb = await Channels.findOne({ id: channel.id });

		const admin = await User.findOne({ userId: channelFromDb.admin });

		const adminOnline = onlineUsers.find(
			(onlineUser) => admin.userId === onlineUser.user
		);

		await User.updateOne(
			{ userId: admin.userId },
			{
				$push: {
					notifications: {
						type: "applyEnter",
						room: channel,
						newUser: user
					}
				}
			}
		);

		if (adminOnline) {
			io.to(adminOnline.socketId).emit("apply enter", { user, channel });
		}
	});

	// // applyResponseController(socket, io);
	// socket.on("apply response", async ({ user, channel, permission }) =>
	// 	applyResponseHandler({ user, channel, permission }, io, socket)
	// );

	socket.on("apply response", async ({ user, channel, permission }) => {
		if (permission) {
			// удаление уведомления для админа
			const channelFromDb = await Channels.findOne({ id: channel.id });
			const admin = await User.findOne({ userId: channelFromDb.admin });
			// запрос на удаление уведомления для дамина в бд
			await User.updateOne(
				{
					userId: admin.userId
				},
				{ $pull: { notifications: { type: "applyEnter", room: channel } } }
			);

			// // добавление нового чата в чаты пользователя
			// await User.updateOne(
			// 	{ userId: user.userId },
			// 	{
			// 		$push: {
			// 			channels: channel.id
			// 		}
			// 	}
			// );

			// // добавление нового пользователя в список участников чата
			// await Channels.updateOne(
			// 	{ id: channel.id },
			// 	{
			// 		$push: {
			// 			participants: user
			// 		}
			// 	}
			// );

			// добавление уведомления пользователя о вступлении в чат
			await User.updateOne(
				{ userId: user.userId },
				{
					$push: {
						notifications: {
							type: "applyEnterResponse",
							room: channel,
							permission: permission,
							newUser: user
						}
					}
				}
			);

			// // формирование входного сообщения
			// const enterMsg = {
			// 	type: "enter",
			// 	userName: user.name,
			// 	userId: user.userId
			// };
			// // добавление сообщения в список сообщений чата
			// await Channels.updateOne(
			// 	{ id: channel.id },
			// 	{
			// 		$push: { messages: enterMsg }
			// 	}
			// );

			// // поиск текущего пользователя в списке онлайн-пользователй
			// let userIndex = -2;
			// onlineUsers.filter((userr, index) => {
			// 	if (userr.socketId === socket.id) {
			// 		userIndex = index;
			// 	}
			// });
			// // добавление нового чата список текущего онлайн-пользователя
			// if (userIndex !== -2) {
			// 	onlineUsers[userIndex].rooms.push(channel.id);
			// }

			// // подключение к комнате
			// socket.join(channel.id);

			// io.to(channel.id).emit("message", {
			// 	message: enterMsg,
			// 	messageOrigin: channel.id
			// });

			const userOnline = onlineUsers.find(
				(onlineUser) => user.userId === onlineUser.user
			);

			if (userOnline) {
				io.to(userOnline.socketId).emit("apply response", {
					user,
					channel,
					permission
				});
			}
		}

		if (!permission) {
			// удаление уведомления для админа
			const channelFromDb = await Channels.findOne({ id: channel.id });
			const admin = await User.findOne({ userId: channelFromDb.admin });

			// запрос на удаление уведомления для дамина в бд
			await User.updateOne(
				{
					userId: admin.userId
				},
				{ $pull: { notifications: { type: "applyEnter", room: channel } } }
			);

			await User.updateOne(
				{ userId: user.userId },
				{
					$push: {
						notifications: {
							type: "applyEnterResponse",
							room: channel,
							permission: permission,
							newUser: user
						}
					}
				}
			);

			const userOnline = onlineUsers.find(
				(onlineUser) => user.userId === onlineUser.user
			);

			if (userOnline) {
				io.to(userOnline.socketId).emit("apply response", {
					user,
					channel,
					permission
				});
			}
		}
	});

	// typingController(socket);

	// socket.on("typing", ({ room, status, user }) =>
	// 	typingHandler({ room, status, user }, socket)
	// );

	socket.on("typing", ({ room, status, user }) => {
		socket.broadcast.to(room).emit("typing", {
			status: status,
			user: user,
			room: room
		});
	});

	// disconnectController(socket, io);
	// socket.on("disconnect", async () => disconnectHandler(io, socket));

	socket.on("disconnect", () => {
		console.log(`User ${socket.id} disconnected`);
		let currentUserIndex = -2;
		const currentUser = onlineUsers.filter((onlineUser, index) => {
			// console.log("currentUser ~ onlineUser.socketId:", onlineUser.socketId);
			// console.log("currentUser ~ socket.id:", socket.id);
			if (onlineUser.socketId === socket.id) {
				currentUserIndex = index;
				return onlineUser;
			}
		})[0];
		// console.log("socket.on ~ currentUser:", currentUser);
		// console.log("old socket.on ~ onlineUsers:", onlineUsers);
		// onlineUsers = onlineUsers.filter(
		// 	(onlineUser) => onlineUser.socketId !== socket.id
		// );
		// console.log("socket.on ~ currentUserIndex:", currentUserIndex);
		// console.log("before - ", onlineUsers);
		if (currentUserIndex !== -2) {
			onlineUsers.splice(currentUserIndex, 1);
		}
		// console.log("after - ", onlineUsers);

		// console.log("logout socket.on ~ onlineUsers:", onlineUsers);

		if (currentUser) {
			currentUser.rooms.map((room) => {
				// socket.broadcast.to(room).emit("online", {
				io.to(room).emit("online", {
					status: false,
					user: currentUser.user
				});
			});
		}

		console.log("onlineUsers", onlineUsers);
	});
});

httpServer.listen(3600, () => {
	console.log("Server listening on port 3600");
});
