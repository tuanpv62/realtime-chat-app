import { io } from "socket.io-client";

let socket = null;

export const createSocket = (accessToken) => {
  if (socket?.connected) socket.disconnect();

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
  });

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
