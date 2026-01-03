// server/src/core/deck.ts
import { PlayingCard } from "../../../shared/types";

/**
 * Create a fresh 52-card deck.
 * Burn state is tracked on each card.
 */
export const createDeck = (): PlayingCard[] => {
  const suits: PlayingCard["suit"][] = ["♠", "♥", "♣", "♦"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const deck: PlayingCard[] = [];

  for (const suit of suits) {
    ranks.forEach((rank, index) => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: index + 1,
        usedBy: null
      });
    });
  }

  return deck;
};

/**
 * Safely resolve card IDs to actual cards.
 * Missing or invalid IDs are silently ignored.
 */
export const resolveCards = (
  deck: PlayingCard[],
  ids: string[] | undefined
): PlayingCard[] => {
  if (!ids || ids.length === 0) return [];

  return ids
    .map(id => deck.find(card => card.id === id))
    .filter(Boolean) as PlayingCard[];
};

/**
 * Burn cards permanently.
 * Burned cards are marked and never reset.
 */
export const burnCards = (
  deck: PlayingCard[],
  cardIds: string[],
  reason = "BURNED"
) => {
  for (const id of cardIds) {
    const card = deck.find(c => c.id === id);
    if (card && card.usedBy === null) {
      card.usedBy = reason;
    }
  }
};

/**
 * Check if a card is already burned.
 */
export const isBurned = (deck: PlayingCard[], cardId: string): boolean => {
  const card = deck.find(c => c.id === cardId);
  return !!card && card.usedBy !== null;
};
