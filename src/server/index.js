import { Server } from "socket.io";

const io = new Server(3000, {
    cors: {
        origin: "*",
    },
});

console.log("Local Game Server running on port 3000");

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`Player ${socket.id} joined room ${roomId}`);
    });

    socket.on("player-update", (data) => {
        // Broadcast to others in the room
        socket.to(data.roomId).emit("player-update", {
            id: socket.id,
            ...data,
        });
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});
