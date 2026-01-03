import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { createGlobalDeck, createNumberHand, PlayingCard, NumberCard } from "./gameLogic";
import { Hand } from "pokersolver";
import { RoomManager, Room } from "./roomManager";

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

const ROUND_TIME_SEC = 60; 

const toSolverFormat = (card: PlayingCard) => {
  const r = card.rank === "10" ? "T" : card.rank;
  const s = card.suit === "♠" ? "s" : card.suit === "♥" ? "h" : card.suit === "♣" ? "c" : "d";
  return r + s;
};

// --- START ROUND ---
const startNewRound = (room: Room) => {
  console.log(`[${room.id}] Starting New Round...`);
  room.phase = "GAME_LOOP";
  room.turnData = {};

  // PERSIST DECK: Only create if missing (preserves burned cards)
  if (!room.globalDeck || room.globalDeck.length === 0) {
      room.globalDeck = createGlobalDeck();
  }
  
  room.pot = 0; 
  if (room.timerInterval) clearInterval(room.timerInterval);

  // Setup Players
  room.players.forEach((pid) => {
    const pState = room.playerStates[pid];
    pState.numberHand = createNumberHand();
    pState.currentBet = 0;
    pState.isSubmitted = false;
    pState.targetLocked = false;
    
    if (pState.bios > 0) {
      pState.bios -= 1;
      room.pot += 1;
    }
  });

  // Notify Clients
  room.players.forEach((pid) => {
    const opId = room.players.find((id) => id !== pid)!;
    io.to(pid).emit("new_round_start", {
      globalDeck: room.globalDeck,
      numberHand: room.playerStates[pid].numberHand,
      bios: room.playerStates[pid].bios,
      opponentBios: room.playerStates[opId].bios,
      pot: room.pot,
      timeRemaining: ROUND_TIME_SEC
    });
  });

  // Start Timer
  let timeLeft = ROUND_TIME_SEC;
  room.timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft % 10 === 0) io.to(room.id).emit("timer_sync", timeLeft);
    if (timeLeft <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      console.log(`[${room.id}] Time expired! Forcing showdown.`);
      forceShowdown(room); 
    }
  }, 1000);
};

// --- RESOLUTION (CRASH PROOFED) ---
const resolveGame = (room: Room) => {
  try {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.phase = "RESOLUTION";

      const [p1, p2] = room.players;
      const data1 = room.turnData[p1] || { cardIds: [], targetId: null };
      const data2 = room.turnData[p2] || { cardIds: [], targetId: null };
      
      // SAFE CARD LOOKUP (No '!' assertion)
      const getCards = (ids: string[] | undefined) => {
          if (!ids) return [];
          return ids.map(id => room.globalDeck.find(c => c.id === id)).filter(c => c !== undefined) as PlayingCard[];
      };

      const cards1 = getCards(data1.cardIds);
      const cards2 = getCards(data2.cardIds);

      let result: any;
      const intersection = data1.cardIds?.filter(id => data2.cardIds?.includes(id)) || [];

      // TIMEOUT RULES: If you didn't pick 5 cards, you LOSE.
      const p1Valid = cards1.length === 5;
      const p2Valid = cards2.length === 5;

      if (!p1Valid && !p2Valid) {
         result = { winner: null, type: "TIMEOUT", desc: "Double Timeout - Draw" };
      } 
      else if (!p1Valid) {
         result = { winner: p2, type: "WIN", desc: "Opponent Timed Out" };
         room.playerStates[p2].bios += room.pot;
      }
      else if (!p2Valid) {
         result = { winner: p1, type: "WIN", desc: "Opponent Timed Out" };
         room.playerStates[p1].bios += room.pot;
      }
      // AGONY RULES
      else if (room.mode === "HARD" && intersection.length > 0) {
         result = { 
            winner: null, type: "OVERLAP", 
            intersectingCards: intersection, desc: "AGONY: Overlap Detected",
            p1Hand: data1.cardIds, p2Hand: data2.cardIds 
         };
      } 
      // STANDARD POKER
      else {
         const h1 = Hand.solve(cards1.map(toSolverFormat));
         const h2 = Hand.solve(cards2.map(toSolverFormat));
         const winners = Hand.winners([h1, h2]);
         
         let winnerId: string | null = null;
         if (winners.length === 1) {
            winnerId = winners[0] === h1 ? p1 : p2;
            room.playerStates[winnerId].bios += room.pot;
         }
         
         result = {
            winner: winnerId,
            type: "WIN",
            desc: winners.length === 1 ? `${winners[0].descr}` : `Draw: ${h1.descr}`,
            intersectingCards: [],
            p1Hand: data1.cardIds,
            p2Hand: data2.cardIds
         };
      }

      // MARK BURNED CARDS
      const allPlayedIds = [...(data1.cardIds || []), ...(data2.cardIds || [])];
      allPlayedIds.forEach((id) => {
          const c = room.globalDeck.find((x) => x.id === id);
          if (c) c.usedBy = "BURNED";
      });

      // CHECK BANKRUPTCY
      let gameOver = null;
      if (room.playerStates[p1].bios <= 0) gameOver = { winner: p2, reason: "Bankruptcy" };
      else if (room.playerStates[p2].bios <= 0) gameOver = { winner: p1, reason: "Bankruptcy" };

      console.log(`[${room.id}] Round Resolved. Winner: ${result.winner}`);

      io.to(room.id).emit("round_result", {
          result,
          updatedDeck: room.globalDeck,
          updatedBios: { [p1]: room.playerStates[p1].bios, [p2]: room.playerStates[p2].bios },
          opponentTargets: { 
            [p1]: room.playerStates[p1].numberHand.find(n => n.id === data1.targetId)?.value || 0, 
            [p2]: room.playerStates[p2].numberHand.find(n => n.id === data2.targetId)?.value || 0 
          },
          gameOver
      });

  } catch (error) {
      console.error(`[${room.id}] CRITICAL ERROR in resolveGame:`, error);
      // Emergency Reset if things blow up
      io.to(room.id).emit("error", "Server Error - Round Voided");
      startNewRound(room);
  }
};

const forceShowdown = (room: Room) => {
   resolveGame(room);
};

// ... SOCKETS ...
io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("create_room", (name) => {
     const room = RoomManager.createRoom(socket.id, name);
     socket.join(room.id);
     socket.emit("room_created", { roomId: room.id });
  });

  socket.on("join_room", ({ roomId, name }) => {
     const room = RoomManager.joinRoom(socket.id, roomId, name);
     if(room && room.players.length === 2) {
        socket.join(room.id);
        startNewRound(room); 
     }
  });

  socket.on("action_target", ({ targetId }) => {
     const room = RoomManager.getRoom(socket.id);
     if (!room || room.phase !== "GAME_LOOP") return;
     if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
     room.turnData[socket.id].targetId = targetId;
     room.playerStates[socket.id].targetLocked = true;
     socket.to(room.id).emit("opponent_action", { type: "TARGET_LOCKED" });
  });

  socket.on("action_bet", ({ amount }) => {
     const room = RoomManager.getRoom(socket.id);
     if (!room || room.phase !== "GAME_LOOP") return;
     const pState = room.playerStates[socket.id];
     if (pState.bios < amount) return;
     pState.bios -= amount;
     pState.currentBet += amount;
     room.pot += amount;
     
     if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
     room.turnData[socket.id].bet = pState.currentBet;
     io.to(room.id).emit("economy_update", { pot: room.pot, bios: { [socket.id]: pState.bios } });
     socket.to(room.id).emit("opponent_action", { type: "BET_PLACED", amount });
  });

  socket.on("action_submit", ({ cardIds }) => {
     const room = RoomManager.getRoom(socket.id);
     if (!room || room.phase !== "GAME_LOOP") return;
     if (!room.turnData[socket.id]) room.turnData[socket.id] = {};
     room.turnData[socket.id].cardIds = cardIds;
     room.playerStates[socket.id].isSubmitted = true;
     socket.to(room.id).emit("opponent_action", { type: "HAND_SUBMITTED" });
     
     // Log the submit
     console.log(`[${room.id}] Player ${socket.id} submitted hand.`);
     
     if (room.players.every(pid => room.playerStates[pid].isSubmitted)) {
         resolveGame(room);
     }
  });

  socket.on("next_round_request", () => {
     const room = RoomManager.getRoom(socket.id);
     if (!room || room.phase !== "RESOLUTION") return;
     startNewRound(room);
  });
  
  socket.on("disconnect", () => RoomManager.removePlayer(socket.id));
});

const PORT = 3001;
httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));