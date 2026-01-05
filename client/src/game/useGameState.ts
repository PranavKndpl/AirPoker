// client/src/game/useGameState.ts
import { useState, useMemo, useEffect } from "react";
import { useSocketEvents } from "./useSocketEvents";
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

  opponentLocked: boolean; 
  opponentTargetValue: number;

  myLocked: boolean; 

  myWins: number;       // <--- NEW
  opponentWins: number; // <--- NEW
  
}

export const useGameState = () => {
  const [phase, setPhase] = useState<GamePhase>("LOBBY");
  const [localStep, setLocalStep] = useState<LocalStep>(LocalStep.PICK_TARGET);
  const [overlay, setOverlay] = useState<Overlay>("NONE");

  const [roomId, setRoomId] = useState<string | null>(null);

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

  const [opponentLocked, setOpponentLocked] = useState(false);
  const [opponentTargetValue, setOpponentTargetValue] = useState(0);

  const [myLocked, setMyLocked] = useState(false);

  const [myWins, setMyWins] = useState(0);            
  const [opponentWins, setOpponentWins] = useState(0); 

  const [oxygenProgress, setOxygenProgress] = useState(0);

  // 1. SOCKET EVENTS
useSocketEvents({
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
  });

  // 2. LOCAL TIMER
  useEffect(() => {
    if (phase !== "GAME_LOOP") return;

    const interval = setInterval(() => {
      setDisplayTimer(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // 3. DERIVED DATA
  const targetValue = useMemo(() => {
    return myNumberHand.find(n => n.id === selectedTargetId)?.value || 0;
  }, [myNumberHand, selectedTargetId]);

  const currentSum = useMemo(() => {
    return selectedCardIds.reduce((sum, id) => {
      const card = globalDeck.find(c => c.id === id);
      return sum + (card?.value || 0);
    }, 0);
  }, [selectedCardIds, globalDeck]);

  // 4. OVERLAY CONTROL
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
      currentSum,

      opponentLocked, 
      opponentTargetValue,

      myLocked,
      
      myWins,       
      opponentWins, 

      oxygenProgress
    },

    setPhase,

    setLocalStep,
    setSelectedTargetId,
    setSelectedCardIds,

    openTableView,
    closeTableView
  };
};
