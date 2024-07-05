import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";
import { User } from "../mongoose/schema/user.mjs";
import { Channels } from "../mongoose/schema/channel.mjs";

export async function deleteChannelHandler({ channel }, io, socket) {
	const channelFromDb = await Channels.findOne({ id: channel.id });

	const usersOfChannel = channelFromDb.participants;

	const admin = await User.findOne({ userId: channelFromDb.admin });

	usersOfChannel.map(async (usersOfChannel) => {
		const channelId = channel.id;
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
}
