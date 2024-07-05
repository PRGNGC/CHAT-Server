import { User } from "../mongoose/schema/user.mjs";
import { Channels } from "../mongoose/schema/channel.mjs";
import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";
import { v4 as uuidv4, v6 as uuidv6 } from "uuid";

export function newChannelController(socket, io) {
	socket.on(
		"new channel",
		async ({ name, accessability, description, admin }) => {
			const newRoom = uuidv6();

			await User.updateOne(
				{ userId: admin.userId },
				{
					$push: { channels: newRoom }
				}
			);

			// let adminIndex = -2;
			// onlineUsers.filter((userr, index) => {
			// 	if (userr.socketId === socket.id) {
			// 		adminIndex = index;
			// 	}
			// });
			// if (adminIndex !== -2) {
			// 	onlineUsers[adminIndex].rooms.push(newRoom);
			// }

			await OnlineUser.updateOne(
				{ socketId: socket.id },
				{
					$push: { rooms: newRoom }
				}
			);

			socket.join(newRoom);

			const newChannel = await Channels({
				name: name,
				id: newRoom,
				messages: [
					{
						content: `User ${admin.name} created the chat`,
						userId: admin.userId,
						type: "create"
					}
				],
				participants: [admin],
				type: "channel",
				availability: accessability,
				admin: admin.userId,
				description: description
			});
			await newChannel.save();

			io.emit("new channel", { admin: admin, newChannel: newChannel });
		}
	);
}
