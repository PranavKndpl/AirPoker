// server/src/sockets/handlers.ts
import { Server, Socket } from "socket.io";
import { RoomStore } from "../state/roomStore";
import { startRound, endRound } from "../core/roundController";

export const registerSocketHandlers = (io: Server, socket: Socket) => {
  const logPrefix = `[SOCKET ${socket.id}]`;

  /* -------------------------------------------------- */
  /* ------------------ ROOM FLOW --------------------- */
  /* -------------------------------------------------- */

  socket.on("create_room", () => {
    const room = RoomStore.createRoom(socket.id);
    socket.join(room.id);
    console.log(`${logPrefix} Created room ${room.id}`);
    socket.emit("room_created", { roomId: room.id });
  });

  socket.on("join_room", ({ roomId }) => {
    const room = RoomStore.joinRoom(socket.id, roomId);
    if (!room) {
      console.warn(`${logPrefix} Failed to join room ${roomId}`);
      return;
    }

    socket.join(room.id);
    console.log(`${logPrefix} Joined room ${room.id}`);

    if (room.players.length === 2) {
      console.log(`[ROOM ${room.id}] Two players ready. Starting round.`);
      startRound(room, io);
    }
  });

  socket.on("disconnect", () => {
    console.warn(`${logPrefix} Disconnected`);
    RoomStore.removePlayer(socket.id);
  });

  /* -------------------------------------------------- */
  /* ------------------ GAME ACTIONS ------------------ */
  /* -------------------------------------------------- */

  socket.on("action_target", ({ targetId }) => {
    const room = RoomStore.getRoomByPlayer(socket.id);
    if (!room) {
      console.warn(`${logPrefix} action_target with no room`);
      return;
    }

    if (room.phase !== "GAME_LOOP") {
      console.warn(
        `${logPrefix} action_target ignored (phase=${room.phase})`
      );
      return;
    }

    const player = room.playerStates[socket.id];
    if (player.targetLocked) {
      console.warn(`${logPrefix} Duplicate target lock ignored`);
      return;
    }

    room.turnData[socket.id] = { targetId };
    player.targetLocked = true;

    console.log(`${logPrefix} Locked target ${targetId}`);
  });

  socket.on("action_bet", ({ amount }) => {
    const room = RoomStore.getRoomByPlayer(socket.id);
    if (!room) {
      console.warn(`${logPrefix} action_bet with no room`);
      return;
    }

    if (room.phase !== "GAME_LOOP") {
      console.warn(`${logPrefix} action_bet ignored (phase=${room.phase})`);
      return;
    }

    const player = room.playerStates[socket.id];

    if (!player.targetLocked) {
      console.warn(
        `${logPrefix} action_bet before target lock ignored`
      );
      return;
    }

    if (amount < 0 || player.bios < amount) {
      console.warn(
        `${logPrefix} Invalid bet amount ${amount} (bios=${player.bios})`
      );
      return;
    }

    player.bios -= amount;
    room.pot += amount;

    console.log(`${logPrefix} Bet ${amount} bios`);

    io.to(room.id).emit("economy_update", {
      pot: room.pot,
      bios: { [socket.id]: player.bios }
    });
  });

  socket.on("action_submit", ({ cardIds }) => {
    const room = RoomStore.getRoomByPlayer(socket.id);
    if (!room) {
      console.warn(`${logPrefix} action_submit with no room`);
      return;
    }

    if (room.phase !== "GAME_LOOP") {
      console.warn(
        `${logPrefix} action_submit ignored (phase=${room.phase})`
      );
      return;
    }

    const player = room.playerStates[socket.id];

    if (!player.targetLocked) {
      console.warn(
        `${logPrefix} action_submit before target lock ignored`
      );
      return;
    }

    if (player.isSubmitted) {
      console.warn(`${logPrefix} Duplicate submission ignored`);
      return;
    }

    room.turnData[socket.id] = {
      ...room.turnData[socket.id],
      cardIds
    };

    player.isSubmitted = true;

    console.log(
      `${logPrefix} Submitted hand (${cardIds?.length || 0} cards)`
    );

    // If all players submitted, resolve immediately
    const allSubmitted = room.players.every(
      pid => room.playerStates[pid].isSubmitted
    );

    if (allSubmitted) {
      console.log(`[ROOM ${room.id}] All players submitted. Resolving.`);
      endRound(room, io, "NORMAL");
    }
  });

  socket.on("next_round_request", () => {
    const room = RoomStore.getRoomByPlayer(socket.id);
    if (!room) {
      console.warn(`${logPrefix} next_round_request with no room`);
      return;
    }

    if (room.phase !== "RESOLUTION") {
      console.warn(
        `${logPrefix} next_round_request ignored (phase=${room.phase})`
      );
      return;
    }

    console.log(`[ROOM ${room.id}] Next round requested`);
    startRound(room, io);
  });
};
