// server/src/gameLogic.ts

export interface Card {
  suit: '♠' | '♥' | '♣' | '♦';
  rank: string;
  value: number; // 1-13 for math
}

const SUITS: ('♠' | '♥' | '♣' | '♦')[] = ['♠', '♥', '♣', '♦'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach((rank, index) => {
      deck.push({
        suit,
        rank,
        value: index + 1 // A=1, K=13
      });
    });
  });
  return shuffle(deck);
};

const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};