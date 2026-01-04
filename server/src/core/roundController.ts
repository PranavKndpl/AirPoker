// server/src/core/roundController.ts
import { Room } from "../state/roomStore";
import { createDeck, burnCards } from "./deck";
import { resolveRound } from "./rules";
import { Server } from "socket.io";
import { PlayingCard } from "../../../shared/types";

const ROUND_TIME_SEC = 60;

/* ------------------------------------------------------------------ */
/* ---------------------------- START ROUND ------------------------- */
/* ------------------------------------------------------------------ */
export const startRound = (room: Room, io: Server) => {
  /* -------------------------------------------------- */
  /* ---------------- ROUND LIMIT CHECK ---------------- */
  /* -------------------------------------------------- */
  if (room.roundCount >= 5) {
    console.log(`[GAME OVER] Room ${room.id} limit reached`);

    const [p1, p2] = room.players;
    const b1 = room.playerStates[p1]?.bios ?? 0;
    const b2 = room.playerStates[p2]?.bios ?? 0;

    let winner: string | null = null;
    if (b1 > b2) winner = p1;
    else if (b2 > b1) winner = p2;

    const gameOver = {
      winner,
      reason: "LIMIT_REACHED",
      finalBios: {
        [p1]: b1,
        [p2]: b2
      }
    };

    io.to(room.id).emit("round_result", {
      result: { outcome: "DRAW", hands: {} },
      gameOver
    });

    room.phase = "GAME_OVER";
    return;
  }

  /* -------------------------------------------------- */
  /* ---------------- NORMAL ROUND START --------------- */
  /* -------------------------------------------------- */
  room.roundCount++;
  console.log(`[ROUND START] Room ${room.id} | Round ${room.roundCount}/5`);

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
/* ------------------------ RANK CLASH LOGIC ------------------------- */
/* ------------------------------------------------------------------ */
const handleRankClash = (
  room: Room,
  p1Cards: PlayingCard[],
  p2Cards: PlayingCard[]
) => {
  if (!p1Cards.length || !p2Cards.length) return;

  const p1Ranks = new Set(p1Cards.map(c => c.rank));
  const p2Ranks = new Set(p2Cards.map(c => c.rank));

  const commonRanks = [...p1Ranks].filter(rank => p2Ranks.has(rank));
  if (commonRanks.length === 0) return;

  console.log(`[CLASH] Room ${room.id} - Ranks: ${commonRanks.join(", ")}`);

  const cardsToBurn = room.globalDeck.filter(
    c => commonRanks.includes(c.rank) && c.usedBy === null
  );

  if (cardsToBurn.length === 0) {
    console.log(`[CLASH] No remaining cards to burn`);
    return;
  }

  const ids = cardsToBurn.map(c => c.id);
  burnCards(room.globalDeck, ids, "RANK_CLASH");
  console.log(`[CLASH BURN] Burned ${ids.length} cards`);
};

/* ------------------------------------------------------------------ */
/* -------------------------- RESOLUTION ----------------------------- */
/* ------------------------------------------------------------------ */
export const endRound = (
    room: Room,
    io: Server,
    reason: "NORMAL" | "TIMEOUT"
  ) => {
    // ---------------------- SAFETY CHECKS ----------------------
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

    // Stop the round timer
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = undefined;
    }

    room.phase = "RESOLUTION";

    // ---------------------- ACTIVE PLAYERS ---------------------
    const activePlayers = room.players.filter(pid => room.playerStates[pid]);
    if (activePlayers.length < 2) {
      console.warn(`[INVALID RESOLUTION] Room ${room.id} missing player state`);
      return;
    }

    const [p1, p2] = activePlayers;

    // ---------------------- RESOLVE ROUND ----------------------
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

    // ---------------------- RANK CLASH CHECK ------------------
    const p1Cards: PlayingCard[] = result.hands[p1]?.cards || [];
    const p2Cards: PlayingCard[] = result.hands[p2]?.cards || [];
    if (p1Cards.length && p2Cards.length) {
      handleRankClash(room, p1Cards, p2Cards);
    }

    // ---------------------- PAYOUT ----------------------------
    const winner =
      result.outcome === "WIN" ? p1 :
      result.outcome === "LOSE" ? p2 :
      null;

    if (winner) {
      room.playerStates[winner].bios += room.pot;
      console.log(`[PAYOUT] Player ${winner} wins ${room.pot} bios`);
    } else {
      console.log(`[DRAW] Pot discarded`);
    }

    // ---------------------- BURN USED CARDS -------------------
    const allCardIds = [
      ...(room.turnData[p1]?.cardIds || []),
      ...(room.turnData[p2]?.cardIds || [])
    ];

    if (allCardIds.length > 0) {
      burnCards(room.globalDeck, allCardIds);
      console.log(`[BURN] Room ${room.id} burned ${allCardIds.length} cards`);
    }

    // ---------------------- GAME OVER CHECK -------------------
    let gameOver: any = null;
    if (room.playerStates[p1].bios <= 0 || room.playerStates[p2].bios <= 0) {
      const finalWinner =
        room.playerStates[p1].bios <= 0 ? p2 :
        room.playerStates[p2].bios <= 0 ? p1 :
        null;

      gameOver = {
        winner: finalWinner,
        reason: "BANKRUPTCY",
        finalBios: {
          [p1]: room.playerStates[p1].bios,
          [p2]: room.playerStates[p2].bios
        }
      };

      console.warn(`[GAME OVER] Room ${room.id}:`, JSON.stringify(gameOver));
    }

    // ---------------------- TARGET VALUES --------------------
    const targetValues: Record<string, number> = {};

    const p1TargetId = room.turnData[p1]?.targetId;
    const p2TargetId = room.turnData[p2]?.targetId;

    if (p1TargetId) {
      const card = room.playerStates[p1].numberHand.find(n => n.id === p1TargetId);
      targetValues[p1] = card ? card.value : 0;
    }

    if (p2TargetId) {
      const card = room.playerStates[p2].numberHand.find(n => n.id === p2TargetId);
      targetValues[p2] = card ? card.value : 0;
    }

    // ---------------------- EMIT ROUND RESULT -----------------
    io.to(room.id).emit("round_result", {
      result,
      updatedDeck: room.globalDeck,
      updatedBios: {
        [p1]: room.playerStates[p1].bios,
        [p2]: room.playerStates[p2].bios
      },
      opponentTargets: targetValues,
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
