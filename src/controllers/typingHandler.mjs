export function typingHandler({ room, status, user }, socket) {
	// console.log("socket.on ~ room:", room);
	socket.broadcast.to(room).emit("typing", {
		status: status,
		user: user,
		room: room
	});
}
