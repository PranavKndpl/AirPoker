// server/src/core/roundController.ts
import { Room } from "../state/roomStore";
import { createDeck, burnCards } from "./deck";
import { resolveRound } from "./rules";
import { Server } from "socket.io";
import { PlayingCard } from "../../../shared/types";

/* ------------------------------------------------------------------ */
/* ------------------------ CONFIGURATION --------------------------- */
/* ------------------------------------------------------------------ */
const ROUND_TIME_SEC = 90;
const OXYGEN_DECAY_INTERVAL = 60; // every 60 ticks, 1 Bio lost

/* ------------------------------------------------------------------ */
/* ------------------------ START ROUND ----------------------------- */
/* ------------------------------------------------------------------ */
export const startRound = (room: Room, io: Server) => {
  // ---------------- ROUND LIMIT CHECK ----------------
  if (room.roundCount >= 5) {
    console.log(`[GAME OVER] Room ${room.id} limit reached`);
    const [p1, p2] = room.players;
    const b1 = room.playerStates[p1]?.bios ?? 0;
    const b2 = room.playerStates[p2]?.bios ?? 0;

    const winner =
      b1 > b2 ? p1 :
      b2 > b1 ? p2 :
      null;

    io.to(room.id).emit("round_result", {
      result: { outcome: "DRAW", hands: {} },
      gameOver: {
        winner,
        reason: "LIMIT_REACHED",
        finalBios: { [p1]: b1, [p2]: b2 }
      }
    });

    room.phase = "GAME_OVER";
    return;
  }

  // ---------------- NORMAL ROUND START ----------------
  room.roundCount++;
  console.log(`[ROUND START] Room ${room.id} | Round ${room.roundCount}/5`);
  room.phase = "GAME_LOOP";
  room.turnData = {};
  room.pot = 0;

  // ---------------- DECK INIT ----------------
  if (room.globalDeck.length === 0) {
    console.log(`[DECK INIT] Creating new deck for room ${room.id}`);
    room.globalDeck = createDeck();
  }

  // ---------------- TIMER RESET ----------------
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  // ---------------- OXYGEN INIT ----------------
  if ((room as any).oxygenTick === undefined) {
    (room as any).oxygenTick = 0;
  }

  // ---------------- ANTE PHASE ----------------
  let anteDeath = false;

  room.players.forEach(pid => {
    const p = room.playerStates[pid];

    // Deduct 1 Bio for ante
    if (p.bios > 0) {
      p.bios -= 1;
      room.pot += 1;
    }

    // Check if player died from ante
    if (p.bios <= 0) anteDeath = true;
  });

  // Emit notification once
  setTimeout(() => {
    io.to(room.id).emit("notification", { message: "Ante Paid: -1 Bios", type: "ANTE" });
  }, 1500);

  // If someone died from ante, resolve round immediately
  if (anteDeath) {
    console.log(`[ANTE DEATH] Room ${room.id} - Resolving immediately`);
    endRound(room, io, "NORMAL");
    return;
  }

  // ---------------- PLAYER SETUP ----------------
  room.players.forEach(pid => {
    const p = room.playerStates[pid];
    p.isSubmitted = false;
    p.targetLocked = false;

    // Generate number hand only on first round
    if (room.roundCount === 1) {
      p.numberHand = generateNumberHand();
    }
  });

  // ---------------- EMIT ROUND START ----------------
  room.players.forEach(pid => {
    const opponentId = room.players.find(p => p !== pid)!;
    io.to(pid).emit("new_round_start", {
      roomId: room.id,
      globalDeck: room.globalDeck,
      numberHand: room.playerStates[pid].numberHand,
      bios: room.playerStates[pid].bios,
      opponentBios: room.playerStates[opponentId].bios,
      pot: room.pot,
      timeRemaining: ROUND_TIME_SEC
    });
  });

  // ---------------- START TIMER ----------------
  startTimer(room, io);
};


/* ------------------------------------------------------------------ */
/* -------------------------- TIMER LOGIC --------------------------- */
/* ------------------------------------------------------------------ */
const startTimer = (room: Room, io: Server) => {
  let timeLeft = ROUND_TIME_SEC;
  console.log(`[TIMER] Room ${room.id} started (${ROUND_TIME_SEC}s)`);

  room.timer = setInterval(() => {
    timeLeft--;

    // ---------------- TIMER SYNC ----------------
    if (timeLeft % 10 === 0 || timeLeft <= 10) {
      io.to(room.id).emit("timer_sync", timeLeft);
      console.log(`[TIMER] Room ${room.id}: ${timeLeft}s left`);
    }

    // ---------------- OXYGEN TICK ----------------
    (room as any).oxygenTick = ((room as any).oxygenTick || 0) + 1;
    const currentTick = (room as any).oxygenTick;

    // Smooth client bar update
    io.to(room.id).emit("oxygen_sync", currentTick % OXYGEN_DECAY_INTERVAL);

    // Deduct 1 Bio every 60 ticks
    if (currentTick % OXYGEN_DECAY_INTERVAL === 0) {
      console.log(`[OXYGEN] Room ${room.id} decay triggered`);

      room.players.forEach(pid => {
        const p = room.playerStates[pid];
        if (p.bios > 0) p.bios -= 1;
      });

      // Update clients
      io.to(room.id).emit("economy_update", {
        bios: room.players.reduce((acc, pid) => {
          acc[pid] = room.playerStates[pid].bios;
          return acc;
        }, {} as Record<string, number>),
        pot: room.pot
      });

      io.to(room.id).emit("notification", {
        message: "Oxygen Low: -1 Bio",
        type: "DECAY"
      });

      // 🚨 MUST HAVE THIS CHECK:
      const hasDeath = room.players.some(
        pid => room.playerStates[pid].bios <= 0
      );

      if (hasDeath) {
        console.log(`[OXYGEN DEATH] Room ${room.id} - Resolving immediately`);
        clearInterval(room.timer!);
        room.timer = undefined;
        endRound(room, io, "NORMAL"); // This sends the BANKRUPTCY reason
        return;
      }
    }

    // ---------------- TIMEOUT ----------------
    if (timeLeft <= 0) {
      console.warn(`[TIMEOUT] Room ${room.id} forcing resolution`);
      clearInterval(room.timer!);
      room.timer = undefined;
      endRound(room, io, "TIMEOUT");
    }
  }, 1000);
};


/* ------------------------------------------------------------------ */
/* ------------------------ RANK CLASH LOGIC ------------------------ */
/* ------------------------------------------------------------------ */
const handleRankClash = (room: Room, p1Cards: PlayingCard[], p2Cards: PlayingCard[]) => {
  if (!p1Cards.length || !p2Cards.length) return;

  const p1Ranks = new Set(p1Cards.map(c => c.rank));
  const p2Ranks = new Set(p2Cards.map(c => c.rank));
  const commonRanks = [...p1Ranks].filter(r => p2Ranks.has(r));

  if (!commonRanks.length) return;

  console.log(`[CLASH] Room ${room.id} - Ranks: ${commonRanks.join(", ")}`);

  const activeIds = new Set([...p1Cards, ...p2Cards].map(c => c.id));
  const cardsToBurn = room.globalDeck.filter(
    c => commonRanks.includes(c.rank) && c.usedBy === null && !activeIds.has(c.id)
  );

  if (!cardsToBurn.length) {
    console.log(`[CLASH] No remaining cards to burn`);
    return;
  }

  const ids = cardsToBurn.map(c => c.id);
  burnCards(room.globalDeck, ids, "RANK_CLASH");
  console.log(`[CLASH BURN] Burned ${ids.length} extra cards (Rank ${commonRanks.join(",")})`);
};

/* ------------------------------------------------------------------ */
/* -------------------------- END ROUND ----------------------------- */
/* ------------------------------------------------------------------ */
export const endRound = (room: Room, io: Server, reason: "NORMAL" | "TIMEOUT") => {
  if (room.players.length < 2) {
    console.warn(`[ABORT END] Room ${room.id} has insufficient players`);
    if (room.timer) clearInterval(room.timer);
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

  const [p1, p2] = room.players;
  const p1State = room.playerStates[p1];
  const p2State = room.playerStates[p2];

  const result = resolveRound(
    [p1, p2],
    room.turnData,
    {
      [p1]: p1State.numberHand,
      [p2]: p2State.numberHand
    },
    room.globalDeck
  );

  console.log(`[RESOLUTION] Room ${room.id}:`, JSON.stringify(result));

  // ---------------- RANK CLASH ----------------
  const p1Cards = result.hands[p1]?.cards || [];
  const p2Cards = result.hands[p2]?.cards || [];
  if (p1Cards.length && p2Cards.length) {
    handleRankClash(room, p1Cards, p2Cards);
  }

  // ---------------- PAYOUT & WIN COUNT ----------------
  const winner =
    result.outcome === "WIN" ? p1 :
    result.outcome === "LOSE" ? p2 :
    null;

  if (winner) {
    room.playerStates[winner].bios += room.pot;
    room.playerStates[winner].wins += 1;
    console.log(`[PAYOUT] Player ${winner} wins pot & round point`);
  }

  // ---------------- BURN PLAYED CARDS ----------------
  const playedIds = [
    ...(room.turnData[p1]?.cardIds || []),
    ...(room.turnData[p2]?.cardIds || [])
  ];
  if (playedIds.length) {
    const uniqueIds = [...new Set(playedIds)];
    burnCards(room.globalDeck, uniqueIds);
    console.log(`[BURN] Room ${room.id} burned ${uniqueIds.length} cards (Played)`);
  }

  // ---------------- MATCH END CONDITIONS ----------------
  let gameOver: any = null;

  if (p1State.bios <= 0) {
    gameOver = { winner: p2, reason: "BANKRUPTCY", stats: { [p1]: 0, [p2]: p2State.bios } };
  } else if (p2State.bios <= 0) {
    gameOver = { winner: p1, reason: "BANKRUPTCY", stats: { [p1]: p1State.bios, [p2]: 0 } };
  } else if (p1State.wins >= 3) {
    gameOver = { winner: p1, reason: "DOMINANCE (3-5)", stats: { [p1]: p1State.bios, [p2]: p2State.bios } };
  } else if (p2State.wins >= 3) {
    gameOver = { winner: p2, reason: "DOMINANCE (3-5)", stats: { [p1]: p1State.bios, [p2]: p2State.bios } };
  } else if (room.roundCount >= 5) {
    const winnerId =
      p1State.bios > p2State.bios ? p1 :
      p2State.bios > p1State.bios ? p2 :
      "DRAW";
    gameOver = { winner: winnerId, reason: "TIME LIMIT", stats: { [p1]: p1State.bios, [p2]: p2State.bios } };
  }

  if (gameOver) {
    room.phase = "GAME_OVER";
  }

  // ---------------- TARGET VALUES ----------------
  const targetValues: Record<string, number> = {};
  [p1, p2].forEach(pid => {
    const tid = room.turnData[pid]?.targetId;
    const card = room.playerStates[pid].numberHand.find(n => n.id === tid);
    targetValues[pid] = card ? card.value : 0;
  });

  // ---------------- MARK TARGETS AS USED ----------------
  [p1, p2].forEach(pid => {
    const targetId = room.turnData[pid]?.targetId;
    if (targetId) {
      const cardIndex = room.playerStates[pid].numberHand.findIndex(c => c.id === targetId);
      if (cardIndex !== -1) room.playerStates[pid].numberHand[cardIndex].isUsed = true;
    }
  });

  // ---------------- EMIT ROUND RESULT ----------------
  io.to(room.id).emit("round_result", {
    result,
    updatedDeck: room.globalDeck,
    updatedBios: { [p1]: p1State.bios, [p2]: p2State.bios },
    updatedWins: { [p1]: p1State.wins, [p2]: p2State.wins },
    opponentTargets: targetValues,
    gameOver
  });
};

/* ------------------------------------------------------------------ */
/* --------------------- NUMBER HAND FACTORY ------------------------ */
/* ------------------------------------------------------------------ */
const generateNumberHand = () => {
  return Array.from({ length: 5 }, () => ({
    id: `num-${Math.random().toString(36).slice(2, 8)}`,
    value: Math.floor(Math.random() * (55 - 15 + 1)) + 15,
    isUsed: false
  }));
};
