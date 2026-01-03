// server/src/core/rules.ts
import { PlayingCard, NumberCard } from "../../../shared/types";
import { Hand } from "pokersolver";
import { resolveCards } from "./deck";

export interface PlayerSubmission {
  targetId?: string;
  cardIds?: string[];
}

export interface ResolutionResult {
  winner: string | null;
  type: "WIN" | "DRAW" | "INVALID";
  reason: string;
}

/**
 * Resolve a round between two players.
 * This function is PURE: no mutation, no sockets.
 */
export const resolveRound = (
  playerIds: [string, string],
  submissions: Record<string, PlayerSubmission>,
  numberHands: Record<string, NumberCard[]>,
  deck: PlayingCard[]
): ResolutionResult => {
  const [p1, p2] = playerIds;

  const r1 = evaluatePlayer(p1, submissions[p1], numberHands[p1], deck);
  const r2 = evaluatePlayer(p2, submissions[p2], numberHands[p2], deck);

  // --- Invalid / Timeout Resolution ---
  if (!r1.valid && !r2.valid) {
    return { winner: null, type: "DRAW", reason: "Both players failed" };
  }

  if (!r1.valid) {
    return { winner: p2, type: "WIN", reason: "Opponent failed target or hand" };
  }

  if (!r2.valid) {
    return { winner: p1, type: "WIN", reason: "Opponent failed target or hand" };
  }

  // --- Both Valid: Compare Poker Hands ---
  const h1 = Hand.solve(r1.cards.map(toSolverFormat));
  const h2 = Hand.solve(r2.cards.map(toSolverFormat));
  const winners = Hand.winners([h1, h2]);

  if (winners.length === 1) {
    return {
      winner: winners[0] === h1 ? p1 : p2,
      type: "WIN",
      reason: winners[0].descr
    };
  }

  return { winner: null, type: "DRAW", reason: h1.descr };
};

/* ------------------------------------------------------------------ */
/* ------------------------ HELPERS --------------------------------- */
/* ------------------------------------------------------------------ */

const evaluatePlayer = (
  playerId: string,
  submission: PlayerSubmission | undefined,
  numberHand: NumberCard[],
  deck: PlayingCard[]
): { valid: boolean; cards: PlayingCard[] } => {
  if (!submission || !submission.cardIds || submission.cardIds.length !== 5) {
    return { valid: false, cards: [] };
  }

  const targetValue = numberHand.find(n => n.id === submission.targetId)?.value;
  if (targetValue === undefined) {
    // Should not happen by design, but server stays strict
    return { valid: false, cards: [] };
  }

  const cards = resolveCards(deck, submission.cardIds);
  if (cards.length !== 5) {
    return { valid: false, cards: [] };
  }

  const sum = cards.reduce((s, c) => s + c.value, 0);
  if (sum !== targetValue) {
    return { valid: false, cards };
  }

  return { valid: true, cards };
};

const toSolverFormat = (card: PlayingCard) => {
  const r = card.rank === "10" ? "T" : card.rank;
  const s =
    card.suit === "♠" ? "s" :
    card.suit === "♥" ? "h" :
    card.suit === "♣" ? "c" : "d";
  return r + s;
};
