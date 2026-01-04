// server/src/core/rules.ts
import { PlayingCard, NumberCard } from "../../../shared/types";
import { Hand } from "pokersolver";
import { resolveCards } from "./deck";

/* ------------------------------------------------------------------ */
/* --------------------------- TYPES -------------------------------- */
/* ------------------------------------------------------------------ */

export interface PlayerSubmission {
  targetId?: string;
  cardIds?: string[];
}

export interface ResolvedHand {
  name: string;       // e.g. "Straight Flush"
  strength: number;   // pokersolver rank (lower = stronger)
  cards?: PlayingCard[];
}

export interface ResolutionResult {
  outcome: "WIN" | "LOSE" | "DRAW";
  hands: {
    [playerId: string]: ResolvedHand;
  };
}

/* ------------------------------------------------------------------ */
/* ----------------------- MAIN RESOLUTION --------------------------- */
/* ------------------------------------------------------------------ */

/**
 * Resolve a round between two players.
 * PURE FUNCTION — no mutation, no sockets, no side effects.
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

  /* ---------------- INVALID / TIMEOUT CASES ---------------- */

  // both failed
  if (!r1.valid && !r2.valid) {
    return {
      outcome: "DRAW",
      hands: {}
    };
  }

  // p1 failed
  if (!r1.valid) {
    const h2 = Hand.solve(r2.cards.map(toSolverFormat));
    return {
      outcome: "LOSE",
      hands: {
        [p2]: {
          name: h2.descr,
          strength: h2.rank
        }
      }
    };
  }

  // p2 failed
  if (!r2.valid) {
    const h1 = Hand.solve(r1.cards.map(toSolverFormat));
    return {
      outcome: "WIN",
      hands: {
        [p1]: {
          name: h1.descr,
          strength: h1.rank
        }
      }
    };
  }

  /* ---------------- BOTH VALID: POKER COMPARISON ---------------- */

  const h1 = Hand.solve(r1.cards.map(toSolverFormat));
  const h2 = Hand.solve(r2.cards.map(toSolverFormat));

  const winners = Hand.winners([h1, h2]);

  let outcome: "WIN" | "LOSE" | "DRAW" = "DRAW";

  if (winners.length === 1) {
    outcome = winners[0] === h1 ? "WIN" : "LOSE";
  }

  return {
    outcome,
    hands: {
      [p1]: {
        name: h1.descr,
        strength: h1.rank,
        cards: r1.cards
      },
      [p2]: {
        name: h2.descr,
        strength: h2.rank,
        cards: r2.cards
      }
    }
  };
};

/* ------------------------------------------------------------------ */
/* -------------------------- HELPERS -------------------------------- */
/* ------------------------------------------------------------------ */

const evaluatePlayer = (
  _playerId: string,
  submission: PlayerSubmission | undefined,
  numberHand: NumberCard[],
  deck: PlayingCard[]
): { valid: boolean; cards: PlayingCard[] } => {
  if (!submission || !submission.cardIds || submission.cardIds.length !== 5) {
    return { valid: false, cards: [] };
  }

  const targetValue = numberHand.find(
    n => n.id === submission.targetId
  )?.value;

  if (targetValue === undefined) {
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

const toSolverFormat = (card: PlayingCard): string => {
  const rank = card.rank === "10" ? "T" : card.rank;
  const suit =
    card.suit === "♠" ? "s" :
    card.suit === "♥" ? "h" :
    card.suit === "♣" ? "c" : "d";

  return rank + suit;
};
