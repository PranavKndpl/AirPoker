// client/src/network/socketBridge.ts
import { io } from 'socket.io-client';

// Use an Environment Variable
const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(URL, {
  transports: ['websocket'],
});