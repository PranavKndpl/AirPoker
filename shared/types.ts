// 1. Basic Card Types
export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13; // A=1, K=13

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g., "H-12" (Queen of Hearts)
}

// 2. Game Phases (The State Machine)
export type GamePhase = 
  | 'LOBBY' 
  | 'BETTING'     // Wager Bio Chips
  | 'SELECTION'   // Pick 5 cards
  | 'REVEAL'      // Show hands, check overlaps
  | 'AGONY';      // Punishment phase

// 3. The Full Game State (Sent to clients)
export interface GameState {
  roomId: string;
  phase: GamePhase;
  pot: number;
  deckRemaining: number; // Just the count, not the cards (to prevent cheating)
  players: {
    [playerId: string]: {
      name: string;
      bioChips: number;
      breathingRate: number; // 1x, 2x, 3x
      isReady: boolean;
      hasActed: boolean; // Did they lock in their bet/hand?
      // Note: We do NOT send the actual 'hand' here to the opponent until reveal
    };
  };
}

// 4. Socket Events (Inputs)
export interface ClientToServerEvents {
  create_room: (data: { name: string }) => void;
  join_room: (data: { roomId: string; name: string }) => void;
  place_bet: (amount: number) => void;
  submit_hand: (cardIds: string[]) => void;
}

export interface ServerToClientEvents {
  game_state_update: (state: GameState) => void;
  error: (msg: string) => void;
  round_result: (result: any) => void; // We'll define result types later
}