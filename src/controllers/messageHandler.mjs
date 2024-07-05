import { Channels } from "../mongoose/schema/channel.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";
import { Dms } from "../mongoose/schema/dms.mjs";

export async function messageHandler(
	{ messageOrigin, message, room, type },
	io,
	socket
) {
	if (message.filesInfo) {
		message.filesInfo.map((file) => {
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

		allUsers.map(async (user) => {
			if (!user.channels.includes(room)) {
				return;
			}

			// const userInOnline = onlineUsers.filter(
			// 	(onlineUser) => onlineUser.user === user.userId
			// );

			const userInOnline = await OnlineUser.findOne({ user: user.userId });

			// if (userInOnline.length === 0) {
			if (userInOnline) {
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

			// const userInOnline = onlineUsers.filter(
			// 	(onlineUser) => onlineUser.user === user.userId
			// );

			const userInOnline = await OnlineUser.findOne({ user: user.userId });

			// if (userInOnline.length === 0) {
			if (userInOnline) {
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

	io.to(room).emit("message", {
		message: message,
		messageOrigin: messageOrigin
	});
}
