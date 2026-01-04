// shared/types.ts

export type SuitSymbol = "♠" | "♥" | "♣" | "♦";

export interface PlayingCard {
  id: string;
  suit: SuitSymbol;
  rank: string;
  value: number;
  usedBy: string | null;
}

export type GamePhase =
  | "LOBBY"
  | "GAME_LOOP"
  | "RESOLUTION"
  | "GAME_OVER";

export interface NumberCard {
  id: string;
  value: number;
  isUsed: boolean;
}

