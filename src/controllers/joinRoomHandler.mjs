import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";

export async function joinRoomHandler({ rooms, user }, io, socket) {
	const allOnlineUsers = await OnlineUser.find({});

	// rooms.map((room) => socket.join(room));
	socket.join(rooms);

	rooms.map((room) => {
		socket.broadcast.to(room).emit("online", {
			status: true,
			user: user
		});
	});

	for (let i = 0; i < allOnlineUsers.length; i++) {
		const commonElements = allOnlineUsers[i].rooms.filter((elem) =>
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
					user: allOnlineUsers[i].user
				});
			});
		}
	}

	// console.log("before socket.on ~ onlineUsers:", onlineUsers);
	const newOnlineUser = await OnlineUser({
		socketId: socket.id,
		user: user,
		rooms: rooms
	});

	await newOnlineUser.save();

	// allOnlineUsers.push({
	// 	socketId: socket.id,
	// 	user: user,
	// 	rooms: rooms
	// });
	// console.log("after socket.on ~ onlineUsers:", onlineUsers);
}
