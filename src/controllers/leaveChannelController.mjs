import { Channels } from "../mongoose/schema/channel.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";

export function leaveChannelController(socket, io) {
	socket.on("leave channel", async ({ room, user }) => {
		// const allOnlineUsers = await OnlineUser.find({});

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

		// let userIndex = -2;
		// onlineUsers.filter((userr, index) => {
		// 	if (userr.socketId === socket.id) {
		// 		userIndex = index;
		// 	}
		// });

		// let roomIndex = -2;
		// onlineUsers[userIndex].rooms.filter((roomm, index) => {
		// 	if (room === roomm) {
		// 		roomIndex = index;
		// 	}
		// });

		// onlineUsers[userIndex].rooms.splice(roomIndex, 1);

		await OnlineUser.updateOne(
			{ socketId: socket.id },
			{
				$pull: {
					rooms: room
				}
			}
		);

		socket.leave(room);

		io.to(room).emit("message", {
			message: leaveMsg,
			messageOrigin: room
		});
	});
}
