// server/src/core/roundController.ts
import { Room } from "../state/roomStore";
import { createDeck, burnCards } from "./deck";
import { resolveRound } from "./rules";
import { Server } from "socket.io";

const ROUND_TIME_SEC = 60;

/* ------------------------------------------------------------------ */
/* ---------------------------- START ROUND ------------------------- */
/* ------------------------------------------------------------------ */
export const startRound = (room: Room, io: Server) => {
  console.log(`[ROUND START] Room ${room.id}`);

  room.phase = "GAME_LOOP";
  room.turnData = {};
  room.pot = 0;

  // Initialize deck if first round
  if (room.globalDeck.length === 0) {
    console.log(`[DECK INIT] Creating new deck for room ${room.id}`);
    room.globalDeck = createDeck();
  }

  // Clear any previous timer
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  // Setup players
  room.players.forEach(pid => {
    const p = room.playerStates[pid];
    p.isSubmitted = false;
    p.targetLocked = false;

    // New number hand every round
    p.numberHand = generateNumberHand();

    // Mandatory air drain
    if (p.bios > 0) {
      p.bios -= 1;
      room.pot += 1;
    } else {
      console.warn(`[AIR WARNING] Player ${pid} started round with 0 bios`);
    }
  });

  // Notify players individually
  room.players.forEach(pid => {
    const opponentId = room.players.find(p => p !== pid)!;
    io.to(pid).emit("new_round_start", {
      globalDeck: room.globalDeck,
      numberHand: room.playerStates[pid].numberHand,
      bios: room.playerStates[pid].bios,
      opponentBios: room.playerStates[opponentId].bios,
      pot: room.pot,
      timeRemaining: ROUND_TIME_SEC
    });
  });

  startTimer(room, io);
};

/* ------------------------------------------------------------------ */
/* ---------------------------- TIMER -------------------------------- */
/* ------------------------------------------------------------------ */
const startTimer = (room: Room, io: Server) => {
  let timeLeft = ROUND_TIME_SEC;
  console.log(`[TIMER] Room ${room.id} started (${ROUND_TIME_SEC}s)`);

  room.timer = setInterval(() => {
    timeLeft--;

    if (timeLeft % 10 === 0) {
      io.to(room.id).emit("timer_sync", timeLeft);
      console.log(`[TIMER] Room ${room.id}: ${timeLeft}s left`);
    }

    if (timeLeft <= 0) {
      console.warn(`[TIMEOUT] Room ${room.id} forcing resolution`);
      clearInterval(room.timer!);
      room.timer = undefined;
      endRound(room, io, "TIMEOUT");
    }
  }, 1000);
};

/* ------------------------------------------------------------------ */
/* -------------------------- RESOLUTION ----------------------------- */
/* ------------------------------------------------------------------ */
export const endRound = (
  room: Room,
  io: Server,
  reason: "NORMAL" | "TIMEOUT"
) => {
  if (room.players.length < 2) {
    console.warn(`[ABORT END] Room ${room.id} has insufficient players`);
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = undefined;
    }
    room.phase = "LOBBY";
    return;
  }

  if (room.phase !== "GAME_LOOP") {
    console.error(`[INVALID END] Attempted to resolve room ${room.id} outside GAME_LOOP`);
    return;
  }

  console.log(`[ROUND END] Room ${room.id} resolving (${reason})`);

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  room.phase = "RESOLUTION";

  const activePlayers = room.players.filter(pid => room.playerStates[pid]);
  if (activePlayers.length < 2) {
    console.warn(`[INVALID RESOLUTION] Room ${room.id} missing player state`);
    return;
  }

  const [p1, p2] = activePlayers;

  // Resolve the round using number hands & turn data
  const result = resolveRound(
    [p1, p2],
    room.turnData,
    {
      [p1]: room.playerStates[p1].numberHand,
      [p2]: room.playerStates[p2].numberHand
    },
    room.globalDeck
  );

  console.log(`[RESOLUTION] Room ${room.id}:`, JSON.stringify(result));

  // Derive winner locally from outcome
  const winner =
    result.outcome === "WIN" ? p1 :
    result.outcome === "LOSE" ? p2 :
    null;

  // Apply pot
  if (winner) {
    room.playerStates[winner].bios += room.pot;
    console.log(`[PAYOUT] Player ${winner} wins ${room.pot} bios`);
  } else {
    console.log(`[DRAW] Pot discarded`);
  }

  // Burn all submitted cards
  const allCardIds = [
    ...(room.turnData[p1]?.cardIds || []),
    ...(room.turnData[p2]?.cardIds || [])
  ];
  if (allCardIds.length > 0) {
    burnCards(room.globalDeck, allCardIds);
    console.log(`[BURN] Room ${room.id} burned ${allCardIds.length} cards`);
  }

  // Bankruptcy check
  let gameOver = null;
  if (room.playerStates[p1].bios <= 0) {
    gameOver = { winner: p2, reason: "Bankruptcy" };
  } else if (room.playerStates[p2].bios <= 0) {
    gameOver = { winner: p1, reason: "Bankruptcy" };
  }
  if (gameOver) {
    console.warn(`[GAME OVER] Room ${room.id}:`, JSON.stringify(gameOver));
  }

  // Emit round result to all players
  io.to(room.id).emit("round_result", {
    result, // contains outcome & hands
    updatedDeck: room.globalDeck,
    updatedBios: {
      [p1]: room.playerStates[p1].bios,
      [p2]: room.playerStates[p2].bios
    },
    opponentTargets: {
      [p1]: room.playerStates[p1].numberHand.find(
        n => n.id === room.turnData[p1]?.targetId
      )?.value || 0,
      [p2]: room.playerStates[p2].numberHand.find(
        n => n.id === room.turnData[p2]?.targetId
      )?.value || 0
    },
    gameOver
  });
};

/* ------------------------------------------------------------------ */
/* --------------------- NUMBER HAND FACTORY ------------------------- */
/* ------------------------------------------------------------------ */
const generateNumberHand = () => {
  const hand = [];
  for (let i = 0; i < 5; i++) {
    const value = Math.floor(Math.random() * (55 - 15 + 1)) + 15;
    hand.push({
      id: `num-${Math.random().toString(36).slice(2, 8)}`,
      value,
      isUsed: false
    });
  }
  return hand;
};
