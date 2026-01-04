// client/src/game/useSocketEvents.ts
import { useEffect } from "react";
import { socket } from "../network/socketBridge";
import { LocalStep } from "./localSteps";

export const useSocketEvents = (
  setRoomId: any,
  setPhase: any,
  setLocalStep: any,
  setGlobalDeck: any,
  setMyNumberHand: any,
  setBios: any,
  setOpponentBios: any,
  setPot: any,
  setServerTimer: any,
  setDisplayTimer: any,
  setSelectedTargetId: any,
  setSelectedCardIds: any,
  setRoundResult: any,
  setGameOver: any,
  setOpponentLocked: any // <--- NEW
) => {
  useEffect(() => {
    /* ------------------ ROOM EVENTS ------------------- */
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
    };

    const handleNewRound = (data: any) => {
      console.log("[CLIENT] New round started");

      setPhase("GAME_LOOP");
      setLocalStep(LocalStep.PICK_TARGET);

      setGlobalDeck(data.globalDeck);
      setMyNumberHand(data.numberHand);

      setBios(data.bios);
      setOpponentBios(data.opponentBios);
      setPot(data.pot);

      setServerTimer(data.timeRemaining);
      setDisplayTimer(data.timeRemaining);

      setSelectedTargetId(null);
      setSelectedCardIds([]);
      setRoundResult(null);

      // ✅ RESET opponent lock at new round
      setOpponentLocked(false);
    };

    const handleTimerSync = (time: number) => {
      setServerTimer(time);
      setDisplayTimer(time);
    };

    const handleEconomyUpdate = (data: any) => {
      setPot(data.pot);
      const biosData = data.bios || {};
      if (socket.id && biosData[socket.id] !== undefined) {
        setBios(biosData[socket.id]);
        const opId = Object.keys(biosData).find(id => id !== socket.id);
        if (opId) setOpponentBios(biosData[opId]);
      }
    };

    /* ---------------- RESULT HANDLING ----------------- */
    const handleRoundResult = (data: any) => {
      console.log("[CLIENT] RAW round_result:", data);

      const result = data.result || {};
      const myId = socket.id!;
      const [p1, p2] = Object.keys(result.hands);
      const opponentId = myId === p1 ? p2 : p1;

      // 1. Calculate My Outcome
      const myOutcome =
        result.outcome === "DRAW"
          ? "DRAW"
          : (result.outcome === "WIN" && myId === p1) ||
            (result.outcome === "LOSE" && myId === p2)
          ? "WIN"
          : "LOSE";

      // 2. Extract Opponent Target
      const opTargets = data.opponentTargets || {};
      const actualOpponentTarget = opTargets[opponentId] ?? 0;

      setRoundResult({
        outcome: myOutcome,
        playerHand: result.hands[myId],
        opponentHand: result.hands[opponentId],
        opponentTargetValue: actualOpponentTarget
      });

      setPhase("RESOLUTION");

      if (Array.isArray(data.updatedDeck)) {
        setGlobalDeck(data.updatedDeck);
      }

      const biosData = data.updatedBios || {};
      if (socket.id && biosData[socket.id] !== undefined) {
        setBios(biosData[socket.id]);
        setOpponentBios(biosData[opponentId]);
      }

      if (data.gameOver) {
        setGameOver(data.gameOver);
      }
    };

    /* ----------------- PLAYER STATUS ----------------- */
    const handleStatusUpdate = (data: { playerId: string; status: string }) => {
      if (data.playerId !== socket.id && data.status === "TARGET_LOCKED") {
        console.log("[GAME] Opponent locked target");
        setOpponentLocked(true);
      }
    };

    /* ------------------- LISTENERS ------------------- */
    socket.on("room_created", handleRoomCreated);
    socket.on("new_round_start", handleNewRound);
    socket.on("timer_sync", handleTimerSync);
    socket.on("economy_update", handleEconomyUpdate);
    socket.on("round_result", handleRoundResult);

    // ✅ NEW listener
    socket.on("player_status_update", handleStatusUpdate);

    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("new_round_start", handleNewRound);
      socket.off("timer_sync", handleTimerSync);
      socket.off("economy_update", handleEconomyUpdate);
      socket.off("round_result", handleRoundResult);

      socket.off("player_status_update", handleStatusUpdate); // cleanup
    };
  }, []);
};
