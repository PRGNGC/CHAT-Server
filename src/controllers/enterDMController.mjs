import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";
import { Dms } from "../mongoose/schema/dms.mjs";
import { User } from "../mongoose/schema/user.mjs";

export function enterDMController(socket, io) {
	socket.on(
		"enter dm",
		async ({ iniciatorUser, secondUser, roomClient, firstUser }) => {
			if (iniciatorUser) {
				const room = iniciatorUser.userId + secondUser.userId;
				await User.updateOne(
					{ userId: iniciatorUser.userId },
					{
						$push: { dms: room }
					}
				);

				// let iniciatorUserIndex = -2;
				// onlineUsers.filter((userr, index) => {
				// 	if (userr.socketId === socket.id) {
				// 		iniciatorUserIndex = index;
				// 	}
				// });
				// if (iniciatorUserIndex !== -2) {
				// 	onlineUsers[iniciatorUserIndex].rooms.push(room);
				// }
				await OnlineUser.updateOne(
					{ socketId: socket.id },
					{ $push: { rooms: room } }
				);

				socket.join(room);

				// let secondUserOnline = onlineUsers.filter(
				// 	(user) => user.user === secondUser.userId
				// );

				let secondUserOnline = await OnlineUser.findOne({
					user: secondUser.userId
				});

				let iniciator = await OnlineUser.findOne({
					user: iniciatorUser.userId
				});

				console.log("secondUserOnline:", secondUserOnline);

				// if (secondUserOnline.length === 0) {
				if (!secondUserOnline) {
					await User.updateOne(
						{ userId: secondUser.userId },
						{
							$push: { dms: room }
						}
					);

					const newDm = await Dms({
						type: "dm",
						id: room,
						messages: [],
						firstUser: iniciatorUser,
						secondUser: secondUser
					});

					io.to(iniciator.socketId).emit("new dm", { newDm: newDm });

					await newDm.save();

					return;
				}

				// if (secondUserOnline.length >= 1) {
				// 	socket
				// 		.to(secondUserOnline[0].socketId)
				// 		.emit("enter dm", { room: room, firstUser: iniciatorUser });
				// 	return;
				// }

				if (secondUserOnline) {
					const newDm = await Dms({
						type: "dm",
						id: room,
						messages: [],
						firstUser: iniciatorUser,
						secondUser: secondUser
					});

					io.to(iniciator.socketId).emit("new dm", { newDm: newDm });

					socket
						.to(secondUserOnline.socketId)
						.emit("enter dm", { room: room, firstUser: iniciatorUser });
					return;
				}
			}

			await User.updateOne(
				{ userId: secondUser.userId },
				{
					$push: { dms: roomClient }
				}
			);

			// let secondUserIndex = -2;
			// onlineUsers.filter((userr, index) => {
			// 	if (userr.socketId === socket.id) {
			// 		secondUserIndex = index;
			// 	}
			// });
			// if (secondUserIndex !== -2) {
			// 	onlineUsers[secondUserIndex].rooms.push(roomClient);
			// }

			await OnlineUser.updateOne(
				{ socketId: socket.id },
				{ $push: { rooms: roomClient } }
			);

			socket.join(roomClient);

			const newDm = await Dms({
				type: "dm",
				id: roomClient,
				messages: [],
				firstUser: firstUser,
				secondUser: secondUser
			});

			io.to(roomClient).emit("new dm", { newDm: newDm });

			await newDm.save();
		}
	);
}
