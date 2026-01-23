import { Server } from "socket.io";

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    console.log("Socket connected:", socket.id, "User:", userId);

    // Join global room so everyone receives new threads
    socket.join("global");

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

export function sendThreadNotification(thread: any) {
  if (!io) return;

  // Broadcast to all connected users
  io.to("global").emit("thread:new", thread);
}

export function sendFollowUpdate(userId: number, followersDelta: number, followingDelta: number) {
  if (!io) return;

  // Emit to the affected user
  io.to(`user:${userId}`).emit("follow:changed", {
    followersDelta,
    followingDelta,
  });
}