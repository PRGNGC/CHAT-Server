export function typingController(socket) {
	socket.on("typing", ({ room, status, user }) => {
		// console.log("socket.on ~ room:", room);
		socket.broadcast.to(room).emit("typing", {
			status: status,
			user: user,
			room: room
		});
	});
}
