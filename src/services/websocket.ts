import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (userId: number) => {
  if (socket) return socket;

  socket = io("http://localhost:3000", {
    auth: { userId },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { socket };