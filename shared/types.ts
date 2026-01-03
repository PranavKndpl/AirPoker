// c:\Users\punnu\Desktop\AirPoker\shared\types.ts

// 1. The Unified Game Lifecycle
export type GamePhase = 
  | 'LOBBY'        // Waiting for players
  | 'GAME_LOOP'    // Round is in progress (Target -> Betting -> Grid)
  | 'RESOLUTION'   // Showing results
  | 'GAME_OVER';   // One player is bankrupt

// 2. Card Types
export type Suit = 'H' | 'D' | 'C' | 'S'; // Keep simple or use symbols if you prefer
export type Rank = string; // "A", "2"..."K"

export interface PlayingCard {
  id: string;      // "H-12"
  suit: string;    // "♥"
  rank: string;    // "Q"
  value: number;   // 12
  usedBy: string | null;
}

export interface NumberCard {
  id: string;
  value: number;
  isUsed: boolean;
}

// 3. Socket Payloads (Optional, but good for type safety later)
export interface GameStatePayload {
    phase: GamePhase;
    pot: number;
    // ... add others if you want strict typing later
}