// server/src/index.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/handlers";

const PORT = process.env.PORT || 3001; 

const httpServer = createServer(); 

const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// ⚠️ FIX: Listen for connection, THEN register handlers for that specific socket
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Now we pass both 'io' (for global broadcasts) and 'socket' (for specific user)
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`[SERVER] Air Poker running on port ${PORT}`);
});