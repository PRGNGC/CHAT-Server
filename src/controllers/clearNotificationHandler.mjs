import { User } from "../mongoose/schema/user.mjs";

export async function clearNotificationHandler(
	{ type, room, user },
	io,
	socket
) {
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
		await User.updateOne(
			{
				userId: user.userId
			},
			{
				$pull: {
					notifications: {
						type: type,
						room: room
					}
				}
			}
		);
		return;
	}
	if (type === "applyEnterResponse") {
		console.log("socket.on ~ applyEnterResponse:");
		console.log("socket.on ~ room:", room);
		await User.updateOne(
			{
				userId: user.userId
			},
			{
				$pull: {
					notifications: {
						type: type,
						room: room
					}
				}
			}
		);
		return;
	}
	if (type === "applyEnter") {
		console.log("socket.on ~ applyEnter:");
		await User.updateOne(
			{
				userId: user.userId
			},
			{ $pull: { notifications: { type: type, room: room } } }
		);
		return;
	}
}
