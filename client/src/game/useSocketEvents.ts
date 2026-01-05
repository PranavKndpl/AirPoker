// client/src/game/useSocketEvents.ts
import { useEffect } from "react";
import { socket } from "../network/socketBridge";
import { LocalStep } from "./localSteps";

// Define the interface so TypeScript helps you autocomplete
interface SocketEventHandlers {
  setRoomId: any;
  setPhase: any;
  setLocalStep: any;
  setGlobalDeck: any;
  setMyNumberHand: any;
  setBios: any;
  setOpponentBios: any;
  setPot: any;
  setServerTimer: any;
  setDisplayTimer: any;
  setSelectedTargetId: any;
  setSelectedCardIds: any;
  setRoundResult: any;
  setGameOver: any;
  setOpponentLocked: any;
  setOpponentTargetValue: any;
  setMyLocked: any;
  setMyWins: any;
  setOpponentWins: any;
  setOxygenProgress: (val: number) => void;
}

export const useSocketEvents = (handlers: SocketEventHandlers) => {
  const {
    setRoomId,
    setPhase,
    setLocalStep,
    setGlobalDeck,
    setMyNumberHand,
    setBios,
    setOpponentBios,
    setPot,
    setServerTimer,
    setDisplayTimer,
    setSelectedTargetId,
    setSelectedCardIds,
    setRoundResult,
    setGameOver,
    setOpponentLocked,
    setOpponentTargetValue,
    setMyLocked,
    setMyWins,
    setOpponentWins,
    setOxygenProgress
  } = handlers;

  useEffect(() => {
    /* ------------------ ROOM EVENTS ------------------- */
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
    };

    const handleNewRound = (data: any) => {
      console.log("[CLIENT] New round started");
      if (data.roomId) {
        setRoomId(data.roomId);
      }
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
      
      // Reset locks and targets
      setOpponentLocked(false);
      setOpponentTargetValue(0);
      setMyLocked(false);
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

    const handleReveal = (data: Record<string, number>) => {
      const myId = socket.id;
      const opponentId = Object.keys(data).find(id => id !== myId);
      if (opponentId) {
        console.log("[GAME] Targets Revealed!");
        setOpponentTargetValue(data[opponentId]);
      }
    };

    const handleStartBetting = () => {
      console.log("[GAME] Auto-transition to Betting");
      setLocalStep(LocalStep.BETTING);
    };

const handleRoundResult = (data: any) => {
  const myId = socket.id!;

  // 1. UPDATE DATA STORES
  const winsData = data.updatedWins || {};
  if (setMyWins && setOpponentWins) {
    const opponentId = Object.keys(winsData).find(id => id !== myId);
    setMyWins(winsData[myId] ?? 0);
    setOpponentWins(opponentId ? winsData[opponentId] ?? 0 : 0);
  }

  // 2. CHECK FOR INSTANT DEATH (New Logic)
  if (data.gameOver) {
    setGameOver(data.gameOver); // Store it first

    // 🚨 OVERRIDE: If someone died (Bankruptcy), skip the result screen immediately.
    if (data.gameOver.reason === "BANKRUPTCY") {
      console.log("[CLIENT] Bankruptcy detected - skipping to Game Over");
      setPhase("GAME_OVER");
      return; // <--- STOP EXECUTION HERE
    }
  }

  // 3. NORMAL RESULT PROCESSING (If we didn't die instantly)
  const result = data.result || {};
  const hands = result.hands || {};
  const [p1, p2] = Object.keys(hands);
  const opponentId = myId === p1 ? p2 : p1;

  const myOutcome =
    result.outcome === "DRAW"
      ? "DRAW"
      : (result.outcome === "WIN" && myId === p1) ||
        (result.outcome === "LOSE" && myId === p2)
      ? "WIN"
      : "LOSE";

  const opTargets = data.opponentTargets || {};
  const actualOpponentTarget = opTargets[opponentId] ?? 0;

  const playerHand = hands[myId];
  const opponentHand = hands[opponentId];

  setRoundResult({
    outcome: myOutcome,
    playerHand,
    opponentHand,
    opponentTargetValue: actualOpponentTarget
  });

  if (Array.isArray(data.updatedDeck)) {
    setGlobalDeck(data.updatedDeck);
  }

  const biosData = data.updatedBios || {};
  if (biosData[myId] !== undefined) {
    setBios(biosData[myId]);
    setOpponentBios(biosData[opponentId]);
  }

  // 4. CHECK FOR EMPTY HANDS (The fix from previous step)
  // If the match ended by Dominance (3 wins), but no cards were played this round
  if (data.gameOver) {
    const myHandCards = playerHand?.cards || [];
    if (myHandCards.length === 0) {
      setPhase("GAME_OVER");
      return;
    }
  }

  setPhase("RESOLUTION");
};



    const handleStatusUpdate = (data: { playerId: string; status: string }) => {
      if (data.status === "TARGET_LOCKED") {
        if (data.playerId === socket.id) {
          setMyLocked(true);
        } else {
          setOpponentLocked(true);
        }
      }
    };

/* ------------------- LISTENERS ------------------- */
socket.on("room_created", handleRoomCreated);
socket.on("new_round_start", handleNewRound);
socket.on("timer_sync", handleTimerSync);
socket.on("economy_update", handleEconomyUpdate);
socket.on("round_result", handleRoundResult);
socket.on("player_status_update", handleStatusUpdate);
socket.on("reveal_targets", handleReveal);
socket.on("start_betting_phase", handleStartBetting);

// ------------------- OXYGEN SYNC -------------------
socket.on("oxygen_sync", (tick: number) => {
  // tick is 0 -> 59
  setOxygenProgress(tick);
});

return () => {
  socket.off("room_created", handleRoomCreated);
  socket.off("new_round_start", handleNewRound);
  socket.off("timer_sync", handleTimerSync);
  socket.off("economy_update", handleEconomyUpdate);
  socket.off("round_result", handleRoundResult);
  socket.off("player_status_update", handleStatusUpdate);
  socket.off("reveal_targets", handleReveal);
  socket.off("start_betting_phase", handleStartBetting);

  // Remove oxygen listener on cleanup
  socket.off("oxygen_sync");
};
}, [])
};