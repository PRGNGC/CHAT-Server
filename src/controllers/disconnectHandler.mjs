import { OnlineUser } from "../mongoose/schema/onlineUser.mjs";

export async function disconnectHandler(io, socket) {
	console.log(`User ${socket.id} disconnected`);

	// const allOnlineUsers = await OnlineUser.find({});
	// let currentUserIndex = -2;
	// const currentUser = allOnlineUsers.filter((onlineUser, index) => {
	// 	// console.log("currentUser ~ onlineUser.socketId:", onlineUser.socketId);
	// 	// console.log("currentUser ~ socket.id:", socket.id);
	// 	if (onlineUser.socketId === socket.id) {
	// 		currentUserIndex = index;
	// 		return onlineUser;
	// 	}
	// })[0];
	// // console.log("socket.on ~ currentUser:", currentUser);
	// // console.log("old socket.on ~ onlineUsers:", onlineUsers);
	// // onlineUsers = onlineUsers.filter(
	// // 	(onlineUser) => onlineUser.socketId !== socket.id
	// // );
	// // console.log("socket.on ~ currentUserIndex:", currentUserIndex);
	// // console.log("before - ", onlineUsers);
	// if (currentUserIndex !== -2) {
	// 	allOnlineUsers.splice(currentUserIndex, 1);
	// }
	// console.log("after - ", onlineUsers);

	// console.log("new socket.on ~ onlineUsers:", onlineUsers);

	const currentUser = await OnlineUser.findOne({ socketId: socket.id });

	await OnlineUser.deleteOne({ socketId: socket.id });

	if (currentUser) {
		currentUser.rooms.map((room) => {
			io.to(room).emit("online", {
				status: false,
				user: currentUser.user
			});
		});
	}
}
// if (currentUser) {
// 	currentUser.rooms.map((room) => {
// 		// socket.broadcast.to(room).emit("online", {
// 		io.to(room).emit("online", {
// 			status: false,
// 			user: currentUser.user
// 		});
// 	});
// }
