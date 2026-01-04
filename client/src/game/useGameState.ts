// client/src/game/useGameState.ts
import { useEffect, useMemo, useState } from "react";
import { socket } from "../network/socketBridge";
import { LocalStep } from "./localSteps";
import type { GamePhase, PlayingCard, NumberCard } from "../../../shared/types";

export type Overlay = "NONE" | "VIEW_TABLE";

export interface GameState {
  phase: GamePhase;
  localStep: LocalStep;
  overlay: Overlay;

  roomId: string | null;
  timer: number;

  globalDeck: PlayingCard[];
  myNumberHand: NumberCard[];

  bios: number;
  opponentBios: number;
  pot: number;

  selectedTargetId: string | null;
  selectedCardIds: string[];

  roundResult: any;
  gameOver: any;

  targetValue: number;
  currentSum: number;
}

export const useGameState = () => {
  const [phase, setPhase] = useState<GamePhase>("LOBBY");
  const [localStep, setLocalStep] = useState<LocalStep>(LocalStep.PICK_TARGET);

  const [overlay, setOverlay] = useState<Overlay>("NONE");

  const [roomId, setRoomId] = useState<string | null>(null);

  // --- TIMER SPLIT ---
  const [serverTimer, setServerTimer] = useState(0);
  const [displayTimer, setDisplayTimer] = useState(0);

  const [globalDeck, setGlobalDeck] = useState<PlayingCard[]>([]);
  const [myNumberHand, setMyNumberHand] = useState<NumberCard[]>([]);

  const [bios, setBios] = useState(25);
  const [opponentBios, setOpponentBios] = useState(25);
  const [pot, setPot] = useState(0);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const [roundResult, setRoundResult] = useState<any>(null);
  const [gameOver, setGameOver] = useState<any>(null);

  /* -------------------------------------------------- */
  /* ---------------- SOCKET EVENTS ------------------- */
  /* -------------------------------------------------- */
  useEffect(() => {
    socket.on("room_created", ({ roomId }) => {
      setRoomId(roomId);
    });

    socket.on("new_round_start", data => {
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
    });

    socket.on("timer_sync", time => {
      setServerTimer(time);
      setDisplayTimer(time);
    });

    socket.on("economy_update", data => {
      setPot(data.pot);

      const biosData = data.bios || {};
      if (socket.id && biosData[socket.id] !== undefined) {
        setBios(biosData[socket.id]);

        const opId = Object.keys(biosData).find(id => id !== socket.id);
        if (opId) setOpponentBios(biosData[opId]);
      }
    });

    socket.on("round_result", data => {
      console.log("[CLIENT] RAW round_result:", data.result);

      const result = data.result || {};
      const myId = socket.id!;
      const [p1, p2] = Object.keys(result.hands);
      const opponentId = myId === p1 ? p2 : p1;

      // 🔑 Normalize outcome relative to ME
      const myOutcome: "WIN" | "LOSE" | "DRAW" =
        result.outcome === "DRAW"
          ? "DRAW"
          : (result.outcome === "WIN" && myId === p1) ||
            (result.outcome === "LOSE" && myId === p2)
          ? "WIN"
          : "LOSE";

      setRoundResult({
        outcome: myOutcome,
        playerHand: result.hands[myId],
        opponentHand: result.hands[opponentId],
        opponentTargets: result.targets ?? null
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
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  /* -------------------------------------------------- */
  /* ---------------- LOCAL TIMER --------------------- */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (phase !== "GAME_LOOP") return;

    const interval = setInterval(() => {
      setDisplayTimer(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  /* -------------------------------------------------- */
  /* ---------------- DERIVED DATA -------------------- */
  /* -------------------------------------------------- */
  const targetValue = useMemo(() => {
    return myNumberHand.find(n => n.id === selectedTargetId)?.value || 0;
  }, [myNumberHand, selectedTargetId]);

  const currentSum = useMemo(() => {
    return selectedCardIds.reduce((sum, id) => {
      const card = globalDeck.find(c => c.id === id);
      return sum + (card?.value || 0);
    }, 0);
  }, [selectedCardIds, globalDeck]);

  /* -------------------------------------------------- */
  /* ---------------- OVERLAY CONTROL ----------------- */
  /* -------------------------------------------------- */
  const openTableView = () => setOverlay("VIEW_TABLE");
  const closeTableView = () => setOverlay("NONE");

  return {
    state: {
      phase,
      localStep,
      overlay,

      roomId,
      timer: displayTimer,

      globalDeck,
      myNumberHand,

      bios,
      opponentBios,
      pot,

      selectedTargetId,
      selectedCardIds,

      roundResult,
      gameOver,

      targetValue,
      currentSum
    },

    setLocalStep,
    setSelectedTargetId,
    setSelectedCardIds,

    openTableView,
    closeTableView
  };
};
