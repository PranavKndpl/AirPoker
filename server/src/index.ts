import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { createDeck, Card } from "./gameLogic"; // Import the new logic

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Store Room State
interface Room {
  id: string;
  players: string[];
  deck: Card[];
  hands: Record<string, Card[]>; // Map playerID -> Cards
}

const rooms: Record<string, Room> = {};

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("create_room", (playerName) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [socket.id],
      deck: createDeck(),
      hands: {}
    };
    socket.join(roomId);
    socket.emit("room_created", { roomId });
  });

  socket.on("join_room", ({ roomId, name }) => {
    const room = rooms[roomId];
    
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      socket.join(roomId);
      
      console.log(`Room ${roomId} is full. Dealing cards...`);
      
      // --- DEALING LOGIC ---
      // Deal 5 cards to each player
      room.players.forEach(playerId => {
        room.hands[playerId] = room.deck.splice(0, 5);
      });

      // Send specific hand to each player
      room.players.forEach(playerId => {
        io.to(playerId).emit("game_started", {
          myHand: room.hands[playerId],
          opponentHandCount: 5 // We don't send opponent cards, just count!
        });
      });

    } else {
      socket.emit("error", "Room full or invalid");
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});