// server/src/state/roomStore.ts
import { PlayingCard, NumberCard, GamePhase } from "../../../shared/types";

export interface PlayerState {
  bios: number;
  numberHand: NumberCard[];
  targetLocked: boolean;
  isSubmitted: boolean;
}

export interface TurnData {
  targetId?: string;
  cardIds?: string[];
}

export interface Room {
  id: string;
  players: string[];
  phase: GamePhase;

  globalDeck: PlayingCard[];
  pot: number;

  playerStates: Record<string, PlayerState>;
  turnData: Record<string, TurnData>;

  timer?: NodeJS.Timeout;
}

const rooms: Record<string, Room> = {};
const playerToRoom: Record<string, string> = {};

export const RoomStore = {
  createRoom(socketId: string): Room {
    const roomId = Math.random().toString(36).slice(2, 6).toUpperCase();

    const room: Room = {
      id: roomId,
      players: [socketId],
      phase: "LOBBY",
      globalDeck: [],
      pot: 0,
      playerStates: {
        [socketId]: {
          bios: 25,
          numberHand: [],
          targetLocked: false,
          isSubmitted: false
        }
      },
      turnData: {}
    };

    rooms[roomId] = room;
    playerToRoom[socketId] = roomId;
    return room;
  },

  joinRoom(socketId: string, roomId: string): Room | null {
    const room = rooms[roomId];
    if (!room || room.players.length >= 2) return null;

    room.players.push(socketId);
    room.playerStates[socketId] = {
      bios: 25,
      numberHand: [],
      targetLocked: false,
      isSubmitted: false
    };

    playerToRoom[socketId] = roomId;
    return room;
  },

  getRoomByPlayer(socketId: string): Room | null {
    const roomId = playerToRoom[socketId];
    return roomId ? rooms[roomId] : null;
  },

  removePlayer(socketId: string) {
    const roomId = playerToRoom[socketId];
    if (!roomId) return;

    delete playerToRoom[socketId];

    const room = rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p !== socketId);
    delete room.playerStates[socketId];
    delete room.turnData[socketId];

    if (room.players.length === 0) {
      delete rooms[roomId];
    }
  }
};
