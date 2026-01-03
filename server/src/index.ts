// server/src/index.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/handlers";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  console.log(`[CONNECT] ${socket.id}`);
  registerSocketHandlers(io, socket);
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Air Poker running on port ${PORT}`);
});
