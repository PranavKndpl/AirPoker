import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { createGlobalDeck, createNumberHand, PlayingCard, NumberCard } from "./gameLogic";
// @ts-ignore
import { Hand } from "pokersolver"; 

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// TYPES
interface Room {
  id: string;
  players: string[];
  globalDeck: PlayingCard[];
  playerStates: {
    [playerId: string]: {
      numberHand: NumberCard[];
      currentBet: number;
    }
  };
  turnData: Record<string, { targetId: string; cardIds: string[] }> | null;
  mode: 'NORMAL' | 'HARD'; // New Mode flag
}

const rooms: Record<string, Room> = {};

// HELPER: Convert our Card format to PokerSolver format (e.g., "10♠" -> "Ts")
const toSolverFormat = (card: PlayingCard) => {
  let r = card.rank;
  if (r === '10') r = 'T'; // Library expects 'T' for 10
  
  let s = '';
  if (card.suit === '♠') s = 's';
  if (card.suit === '♥') s = 'h';
  if (card.suit === '♣') s = 'c';
  if (card.suit === '♦') s = 'd';
  
  return r + s;
};

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Create Room (Default to NORMAL mode)
  socket.on("create_room", (playerName) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase(); // Short ID
    rooms[roomId] = {
      id: roomId,
      players: [socket.id],
      globalDeck: [], // Will init on start
      playerStates: {
        [socket.id]: { numberHand: [], currentBet: 0 }
      },
      turnData: {},
      mode: 'NORMAL' // <--- CHANGE TO 'HARD' HERE TO TEST HARD MODE LATER
    };
    socket.join(roomId);
    socket.emit("room_created", { roomId });
    console.log(`Room ${roomId} created.`);
  });

  // 2. Join Room & Start
  socket.on("join_room", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      room.playerStates[socket.id] = { numberHand: [], currentBet: 0 };
      socket.join(roomId);
      
      if (room.players.length === 2) {
        console.log(`Room ${roomId}: Game Starting in ${room.mode} Mode`);
        // Init Game Data
        room.globalDeck = createGlobalDeck();
        room.players.forEach(pid => {
          room.playerStates[pid].numberHand = createNumberHand();
          io.to(pid).emit("game_started", {
            globalDeck: room.globalDeck,
            numberHand: room.playerStates[pid].numberHand,
            mode: room.mode
          });
        });
      }
    } else {
      socket.emit("error", "Room invalid");
    }
  });

  // 3. Submit Turn & Resolution Logic
  socket.on("submit_turn", ({ targetId, cardIds }) => {
    const player = rooms[Object.keys(rooms).find(id => rooms[id].players.includes(socket.id)) || ''];
    if (!player) return;
    const room = rooms[player.id];

    if (!room.turnData) room.turnData = {};
    room.turnData[socket.id] = { targetId, cardIds };

    // Check if both players ready
    if (room.players.every(pid => room.turnData![pid])) {
      const p1 = room.players[0];
      const p2 = room.players[1];
      const move1 = room.turnData![p1];
      const move2 = room.turnData![p2];

      // A. Get actual card objects
      const cards1 = move1.cardIds.map(id => room.globalDeck.find(c => c.id === id)!);
      const cards2 = move2.cardIds.map(id => room.globalDeck.find(c => c.id === id)!);

      // B. Check Overlaps
      const intersection = move1.cardIds.filter(id => move2.cardIds.includes(id));
      
      let result = null;

      // --- LOGIC SPLIT BASED ON MODE ---
      if (room.mode === 'HARD' && intersection.length > 0) {
        // HARD MODE: Overlap = Instant Tie/Penalty
        result = {
          winner: null,
          type: 'OVERLAP',
          intersectingCards: intersection,
          p1Hand: move1.cardIds,
          p2Hand: move2.cardIds,
          desc: "Overlap detected in Hard Mode."
        };
      } else {
        // NORMAL MODE (Or Hard Mode with no overlap): Compare Poker Hands
        const hand1 = Hand.solve(cards1.map(toSolverFormat));
        const hand2 = Hand.solve(cards2.map(toSolverFormat));
        const winnerHand = Hand.winners([hand1, hand2]);

        let winnerId = null;
        let desc = "Tie Game";

        if (winnerHand.length === 1) {
          // We have a clear winner
          winnerId = (winnerHand[0] === hand1) ? p1 : p2;
          desc = `${winnerHand[0].descr} beats ${winnerHand[0] === hand1 ? hand2.descr : hand1.descr}`;
        } else {
          desc = `Draw: Both have ${hand1.descr}`;
        }

        result = {
          winner: winnerId,
          type: 'WIN',
          p1Hand: move1.cardIds,
          p2Hand: move2.cardIds,
          desc: desc
        };
      }

      // C. Burn Cards (In Normal Mode, overlapped cards are burned for BOTH)
      [...move1.cardIds, ...move2.cardIds].forEach(id => {
        const c = room.globalDeck.find(x => x.id === id);
        if (c) c.usedBy = "BURNED";
      });

      // D. Send Result
      io.to(room.id).emit("round_result", {
        result,
        updatedDeck: room.globalDeck
      });

      // E. Reset Turn
      room.turnData = {};
    }
  });

  socket.on("disconnect", () => {
    // Handle cleanup later
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});