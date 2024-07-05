import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { Channels } from "../mongoose/schema/channel.mjs";

export async function enterChannelHandler({ room, user }, io, socket) {
	// console.log("socket.on ~ user:", user);
	// console.log("socket.on ~ room:", room);

	// const allOnlineUsers = await OnlineUser.find({});

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

	await Channels.updateOne(
		{ id: room },
		{
			$push: {
				participants: {
					userId: user.userId,
					userImg: user.userImg,
					name: user.name
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
	// if (userIndex !== -2) {
	// 	onlineUsers[userIndex].rooms.push(room);
	// }

	await OnlineUser.updateOne(
		{ socketId: socket.id },
		{
			$push: {
				rooms: { room }
			}
		}
	);

	socket.join(room);

	io.to(room).emit("message", {
		message: enterMsg,
		messageOrigin: room
	});
}
