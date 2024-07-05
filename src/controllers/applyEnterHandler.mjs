import { User } from "../mongoose/schema/user.mjs";
import { Channels } from "../mongoose/schema/channel.mjs";
import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";

export async function applyEnterHandler({ user, channel }, io, socket) {
	const channelFromDb = await Channels.findOne({ id: channel.id });

	const admin = await User.findOne({ userId: channelFromDb.admin });

	// const adminOnline = onlineUsers.find(
	// 	(onlineUser) => admin.userId === onlineUser.user
	// );

	const adminOnline = await OnlineUser.findOne({ user: admin.userId });

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
}
