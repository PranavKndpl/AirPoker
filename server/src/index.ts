// server/src/index.ts
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

// ... (startNewRound function remains the same) ...
const startNewRound = (room: Room) => {
  room.phase = "GAME_LOOP";
  room.turnData = {};
  room.globalDeck = createGlobalDeck();
  room.pot = 0; 

  if (room.timerInterval) clearInterval(room.timerInterval);

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

  let timeLeft = ROUND_TIME_SEC;
  room.timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft % 10 === 0) io.to(room.id).emit("timer_sync", timeLeft);
    if (timeLeft <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      forceShowdown(room); 
    }
  }, 1000);
};

// --- FIXED RESOLUTION LOGIC ---
const resolveGame = (room: Room) => {
  if (room.timerInterval) clearInterval(room.timerInterval);
  room.phase = "RESOLUTION";

  const [p1, p2] = room.players;
  const data1 = room.turnData[p1] || { cardIds: [], targetId: null };
  const data2 = room.turnData[p2] || { cardIds: [], targetId: null };
  
  const cards1 = (data1.cardIds || []).map(id => room.globalDeck.find(c => c.id === id)!);
  const cards2 = (data2.cardIds || []).map(id => room.globalDeck.find(c => c.id === id)!);

  let result: any;
  const intersection = data1.cardIds?.filter(id => data2.cardIds?.includes(id)) || [];

  if (cards1.length < 5 || cards2.length < 5) {
     result = { type: "TIMEOUT", desc: "Incomplete Hand - Round Voided" };
  } 
  else if (room.mode === "HARD" && intersection.length > 0) {
     result = { 
        winner: null, 
        type: "OVERLAP", 
        intersectingCards: intersection, 
        desc: "AGONY: Overlap Detected",
        p1Hand: data1.cardIds, // Include hands even on overlap
        p2Hand: data2.cardIds 
     };
  } 
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
        // SHOW ACTUAL HAND NAME (e.g. "Full House")
        desc: winners.length === 1 ? `${winners[0].descr} wins` : `Draw: ${h1.descr}`,
        intersectingCards: [],
        p1Hand: data1.cardIds, // <--- CRITICAL FIX: Send Hand IDs in result
        p2Hand: data2.cardIds  // <--- CRITICAL FIX: Send Hand IDs in result
     };
  }

  // Send Results
  io.to(room.id).emit("round_result", {
      result,
      updatedDeck: room.globalDeck,
      updatedBios: { [p1]: room.playerStates[p1].bios, [p2]: room.playerStates[p2].bios },
      // Also send targets so we can reveal the hidden number card
      opponentTargets: { [p1]: room.playerStates[p1].numberHand.find(n => n.id === data1.targetId)?.value, [p2]: room.playerStates[p2].numberHand.find(n => n.id === data2.targetId)?.value }
  });
};

const forceShowdown = (room: Room) => {
   resolveGame(room);
};

// ... (Socket Handlers) ...
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
     if (room.players.every(pid => room.playerStates[pid].isSubmitted)) resolveGame(room);
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