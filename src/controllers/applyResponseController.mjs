import { User } from "../mongoose/schema/user.mjs";
import { Channels } from "../mongoose/schema/channel.mjs";
import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";

export function applyResponseController(socket, io) {
	socket.on("apply response", async ({ user, channel, permission }) => {
		if (permission) {
			await User.updateOne(
				{ userId: user.userId },
				{
					$push: {
						channels: channel.id
					}
				}
			);

			await Channels.updateOne(
				{ id: channel.id },
				{
					$push: {
						participants: user
					}
				}
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

			const enterMsg = {
				type: "enter",
				userName: user.name,
				userId: user.userId
			};

			await Channels.updateOne(
				{ id: channel.id },
				{
					$push: { messages: enterMsg }
				}
			);

			// let userIndex = -2;
			// onlineUsers.filter((userr, index) => {
			// 	if (userr.socketId === socket.id) {
			// 		userIndex = index;
			// 	}
			// });
			// if (userIndex !== -2) {
			// 	onlineUsers[userIndex].rooms.push(channel.id);
			// }

			await OnlineUser.updateOne(
				{ socketId: socket.id },
				{ $push: { rooms: channel.id } }
			);

			socket.join(channel.id);

			io.to(channel.id).emit("message", {
				message: enterMsg,
				messageOrigin: channel.id
			});

			// const userOnline = onlineUsers.find(
			// 	(onlineUser) => user.userId === onlineUser.user
			// );

			const userOnline = await OnlineUser.findOne({ user: user.userId });

			if (userOnline) {
				io.to(userOnline.socketId).emit("apply response", {
					user,
					channel,
					permission
				});
			}
		}

		if (!permission) {
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

			// const userOnline = onlineUsers.find(
			// 	(onlineUser) => user.userId === onlineUser.user
			// );

			const userOnline = await OnlineUser.findOne({ user: user.userId });

			if (userOnline) {
				io.to(userOnline.socketId).emit("apply response", {
					user,
					channel,
					permission
				});
			}
		}
	});
}
