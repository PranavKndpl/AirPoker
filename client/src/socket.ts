import { io, Socket } from "socket.io-client";

// Connect to the server we just started
const URL = "http://localhost:3001"; 

export const socket: Socket = io(URL, {
  autoConnect: false, // We connect only when the user clicks "Start"
});

// Debugging helper
socket.onAny((event, ...args) => {
  console.log(`[SOCKET] ${event}`, args);
});