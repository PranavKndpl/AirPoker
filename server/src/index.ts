import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { createGlobalDeck, createNumberHand, PlayingCard, NumberCard } from "./gameLogic";
// @ts-ignore
import { Hand } from "pokersolver"; 

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// --- TYPES ---
type GamePhase = 'LOBBY' | 'TARGET' | 'BETTING' | 'GRID' | 'RESOLUTION';

interface PlayerState {
  numberHand: NumberCard[];
  bios: number;        // Health
  currentBet: number;  // Bet for this specific round
  targetLocked: boolean;
}

interface Room {
  id: string;
  players: string[];     // Array of Socket IDs
  phase: GamePhase;      // <--- EXPLICIT PHASE
  globalDeck: PlayingCard[];
  pot: number;
  mode: 'NORMAL' | 'HARD';
  
  playerStates: Record<string, PlayerState>;
  
  // Scoped Turn Data (Reset every round)
  turnData: {
    [playerId: string]: {
      targetId?: string;
      bet?: number;
      cardIds?: string[];
    }
  };
}

// --- STATE STORAGE ---
const rooms: Record<string, Room> = {};
// optimization: Instant lookup map (SocketID -> RoomID)
const playerDirectory: Record<string, { roomId: string; name: string }> = {};


// --- HELPERS ---
const toSolverFormat = (card: PlayingCard) => {
  let r = card.rank === '10' ? 'T' : card.rank;
  const s = card.suit === '♠' ? 's' : card.suit === '♥' ? 'h' : card.suit === '♣' ? 'c' : 'd';
  return r + s;
};

const getRoom = (socketId: string): Room | undefined => {
  const record = playerDirectory[socketId];
  if (!record) return undefined;
  return rooms[record.roomId];
};

const resetRound = (room: Room) => {
  room.pot = 0;
  room.phase = 'TARGET';
  room.turnData = {};
  
  // Reset per-player round state
  room.players.forEach(pid => {
    room.playerStates[pid].currentBet = 0;
    room.playerStates[pid].targetLocked = false;
    // Auto-Pay Ante (1 Bio)
    if (room.playerStates[pid].bios > 0) {
      room.playerStates[pid].bios -= 1;
      room.pot += 1;
    }
  });

  // Notify clients
  io.to(room.id).emit("new_round", {
    pot: room.pot,
    biosMap: room.players.reduce((acc, pid) => ({ ...acc, [pid]: room.playerStates[pid].bios }), {})
  });
};


io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // --- 1. LOBBY & SETUP ---
  
  socket.on("create_room", (playerName) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    rooms[roomId] = {
      id: roomId,
      players: [socket.id],
      phase: 'LOBBY',
      globalDeck: [],
      pot: 0,
      mode: 'NORMAL',
      playerStates: {
        [socket.id]: { numberHand: [], bios: 25, currentBet: 0, targetLocked: false }
      },
      turnData: {}
    };

    // Register in Directory
    playerDirectory[socket.id] = { roomId, name: playerName };
    
    socket.join(roomId);
    socket.emit("room_created", { roomId });
  });

  socket.on("join_room", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      
      // Init State
      room.playerStates[socket.id] = { numberHand: [], bios: 25, currentBet: 0, targetLocked: false };
      playerDirectory[socket.id] = { roomId, name };
      socket.join(roomId);

      // START GAME
      if (room.players.length === 2) {
        console.log(`Room ${roomId}: Starting Game`);
        room.globalDeck = createGlobalDeck();
        room.pot = 0;

        // Init Hands & Ante
        room.players.forEach(pid => {
          room.playerStates[pid].numberHand = createNumberHand();
          room.playerStates[pid].bios -= 1; // Ante
          room.pot += 1;
        });

        room.phase = 'TARGET'; // <--- SET INITIAL PHASE

        // Send Initial State
        room.players.forEach(pid => {
          const opId = room.players.find(id => id !== pid)!;
          io.to(pid).emit("game_started", {
            globalDeck: room.globalDeck,
            numberHand: room.playerStates[pid].numberHand,
            bios: room.playerStates[pid].bios,
            opponentBios: room.playerStates[opId].bios,
            pot: room.pot
          });
        });
      }
    }
  });

  // --- 2. PHASE: TARGET SELECTION ---

  socket.on("lock_target", ({ targetId }) => {
    const room = getRoom(socket.id);
    if (!room || room.phase !== 'TARGET') return; // Guard Phase

    // Guard duplicate
    if (room.turnData[socket.id]?.targetId) return;

    if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
    room.turnData[socket.id].targetId = targetId;
    room.playerStates[socket.id].targetLocked = true;

    // Notify opponent for visual effect
    socket.to(room.id).emit("opponent_locked_target");

    // Check if both ready
    if (room.players.every(pid => room.turnData[pid]?.targetId)) {
      room.phase = 'BETTING'; // <--- ADVANCE PHASE
      io.to(room.id).emit("phase_change", { phase: 'BETTING' });
    }
  });

  // --- 3. PHASE: BETTING ---

  socket.on("place_bet", ({ amount }) => {
    const room = getRoom(socket.id);
    if (!room || room.phase !== 'BETTING') return;

    const pState = room.playerStates[socket.id];
    
    // Guard: Can't bet more than you have
    if (amount > pState.bios) return; 
    // Guard: Duplicate bet
    if (room.turnData[socket.id]?.bet !== undefined) return;

    // Execute Bet
    pState.currentBet = amount;
    pState.bios -= amount;
    room.pot += amount;
    
    if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
    room.turnData[socket.id].bet = amount;

    // Check if both bets in
    if (room.players.every(pid => room.turnData[pid]?.bet !== undefined)) {
      
      // Update Economy for everyone
      room.players.forEach(pid => {
         const opId = room.players.find(id => id !== pid)!;
         io.to(pid).emit("update_economy", {
            bios: room.playerStates[pid].bios,
            opponentBios: room.playerStates[opId].bios,
            pot: room.pot
         });
      });

      room.phase = 'GRID'; // <--- ADVANCE PHASE
      io.to(room.id).emit("phase_change", { phase: 'SELECTION_GRID' });
    }
  });

  // --- 4. PHASE: GRID SELECTION & RESOLUTION ---

  socket.on("submit_turn", ({ targetId, cardIds }) => {
    const room = getRoom(socket.id);
    if (!room || room.phase !== 'GRID') return;

    if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
    room.turnData[socket.id].cardIds = cardIds;
    // Note: We already have targetId from phase 1, but we can verify it matches if we want strict security

    // Check if both submitted
    if (room.players.every(pid => room.turnData[pid]?.cardIds)) {
      room.phase = 'RESOLUTION'; // <--- ADVANCE PHASE
      
      const p1 = room.players[0];
      const p2 = room.players[1];
      const move1 = room.turnData[p1];
      const move2 = room.turnData[p2];

      // Logic: Overlap Check
      const intersection = move1.cardIds!.filter(id => move2.cardIds!.includes(id));
      
      let result = null;

      // -- HARD MODE OVERLAP --
      if (room.mode === 'HARD' && intersection.length > 0) {
        result = {
          winner: null,
          type: 'OVERLAP',
          intersectingCards: intersection,
          p1Hand: move1.cardIds,
          p2Hand: move2.cardIds,
          desc: "AGONY: Overlap Detected"
        };
      } else {
        // -- POKER RESOLUTION --
        const cards1 = move1.cardIds!.map(id => room.globalDeck.find(c => c.id === id)!);
        const cards2 = move2.cardIds!.map(id => room.globalDeck.find(c => c.id === id)!);
        
        const h1 = Hand.solve(cards1.map(toSolverFormat));
        const h2 = Hand.solve(cards2.map(toSolverFormat));
        const winners = Hand.winners([h1, h2]);

        let winnerId = null;
        let desc = "Tie";

        if (winners.length === 1) {
          winnerId = (winners[0] === h1) ? p1 : p2;
          desc = `${winners[0].descr} beats ${winners[0] === h1 ? h2.descr : h1.descr}`;
          
          // PAYOUT POT
          room.playerStates[winnerId].bios += room.pot;
          desc += ` (Won ${room.pot} Bios)`;
        } else {
          // Split pot? Or carry over? For now, carry over (no payout)
          desc = `Draw: ${h1.descr}`;
        }

        result = {
          winner: winnerId,
          type: 'WIN',
          p1Hand: move1.cardIds,
          p2Hand: move2.cardIds,
          desc
        };
      }

      // Burn Cards
      [...move1.cardIds!, ...move2.cardIds!].forEach(id => {
        const c = room.globalDeck.find(x => x.id === id);
        if (c) c.usedBy = "BURNED";
      });
      
      // Mark Targets as Used
      const t1 = room.playerStates[p1].numberHand.find(n => n.id === move1.targetId);
      const t2 = room.playerStates[p2].numberHand.find(n => n.id === move2.targetId);
      if(t1) t1.isUsed = true;
      if(t2) t2.isUsed = true;

      // Send Results
      io.to(room.id).emit("round_result", {
        result,
        updatedDeck: room.globalDeck,
        updatedBios: { [p1]: room.playerStates[p1].bios, [p2]: room.playerStates[p2].bios }
      });
      
      // We do NOT clear turnData here immediately, we wait for "Next Round" signal
      // or we can auto-start next round after delay.
    }
  });

  // --- 5. NEXT ROUND ---
  socket.on("next_round_confirm", () => {
    // Simple logic: If both click "Next Round", reset.
    // Ideally use turnData flags again.
    const room = getRoom(socket.id);
    if (!room || room.phase !== 'RESOLUTION') return;
    
    // For MVP, just auto-reset if one clicks (or handle dual confirm later)
    resetRound(room);
  });

  socket.on("disconnect", () => {
    const record = playerDirectory[socket.id];
    if (record) {
      delete playerDirectory[socket.id];
      // Handle room cleanup logic (user left)
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});