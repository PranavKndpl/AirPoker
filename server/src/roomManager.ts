// server/src/roomManager.ts
import { PlayingCard, NumberCard } from "./gameLogic";

// 1. ADDED 'GAME_LOOP' to the allowed phases
export type GamePhase = 'LOBBY' | 'GAME_LOOP' | 'RESOLUTION';

export interface PlayerState {
  numberHand: NumberCard[];
  bios: number;
  currentBet: number;
  targetLocked: boolean;
  // 2. ADDED isSubmitted to track if they clicked "Confirm Hand"
  isSubmitted: boolean; 
}

export interface Room {
  id: string;
  players: string[];
  phase: GamePhase;
  globalDeck: PlayingCard[];
  pot: number;
  mode: 'NORMAL' | 'HARD';
  playerStates: Record<string, PlayerState>;
  turnData: {
    [playerId: string]: { targetId?: string; bet?: number; cardIds?: string[]; }
  };
  // 3. ADDED timerInterval to track the server-side clock
  timerInterval?: NodeJS.Timeout; 
}

const rooms: Record<string, Room> = {};
const playerDirectory: Record<string, { roomId: string; name: string }> = {};

export const RoomManager = {
  createRoom: (socketId: string, playerName: string): Room => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [socketId],
      phase: 'LOBBY',
      globalDeck: [],
      pot: 0,
      mode: 'NORMAL',
      playerStates: {
        [socketId]: { 
            numberHand: [], bios: 25, currentBet: 0, 
            targetLocked: false, isSubmitted: false 
        }
      },
      turnData: {}
    };
    playerDirectory[socketId] = { roomId, name: playerName };
    return rooms[roomId];
  },

  getRoom: (socketId: string): Room | undefined => {
    const record = playerDirectory[socketId];
    if (!record) return undefined;
    return rooms[record.roomId];
  },
  
  joinRoom: (socketId: string, roomId: string, name: string): Room | null => {
    const room = rooms[roomId];
    if (!room || room.players.length >= 2) return null;
    
    room.players.push(socketId);
    room.playerStates[socketId] = { 
        numberHand: [], bios: 25, currentBet: 0, 
        targetLocked: false, isSubmitted: false 
    };
    playerDirectory[socketId] = { roomId, name };
    return room;
  },

  removePlayer: (socketId: string) => {
    const record = playerDirectory[socketId];
    if (record) {
      delete playerDirectory[socketId];
      // Note: You might want to clean up the room object here if empty
    }
  }
};