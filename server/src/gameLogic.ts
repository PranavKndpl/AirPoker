// server/src/gameLogic.ts

export interface PlayingCard {
  id: string;   // "H-1" (Ace of Hearts)
  suit: '♠' | '♥' | '♣' | '♦';
  rank: string; // "A", "2"..."K"
  value: number; // 1 to 13
  usedBy: string | null; // PlayerID who burned this card, or null
}

export interface NumberCard {
  id: string;
  value: number; // The target sum (e.g., 36)
  isUsed: boolean;
}

// Generate the 52 card deck (Shared Resource)
export const createGlobalDeck = (): PlayingCard[] => {
  const suits: ('♠' | '♥' | '♣' | '♦')[] = ['♠', '♥', '♣', '♦'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: PlayingCard[] = [];
  suits.forEach(suit => {
    ranks.forEach((rank, index) => {
      deck.push({
        id: `${suit}-${rank}`, // Unique ID
        suit,
        rank,
        value: index + 1, // A=1, K=13
        usedBy: null
      });
    });
  });
  return deck;
};

// Generate 5 Number Cards (Targets) for a player
// Range: Min valid sum (1+2+3+4+5 = 15) to Max valid sum (9+10+11+12+13 = 55)
export const createNumberHand = (): NumberCard[] => {
  const hand: NumberCard[] = [];
  for (let i = 0; i < 5; i++) {
    // Random integer between 15 and 55
    const val = Math.floor(Math.random() * (55 - 15 + 1)) + 15;
    hand.push({
      id: `num-${Math.random().toString(36).substr(2, 5)}`,
      value: val,
      isUsed: false
    });
  }
  return hand;
};