export function typingHandler({ room, status, user }, socket) {
	socket.broadcast.to(room).emit("typing", {
		status: status,
		user: user,
		room: room
	});
}
