// client/src/game/useGameActions.ts
import { socket } from "../network/socketBridge";
import { LocalStep, canTransition } from "./localSteps";
import type { GamePhase } from "../../../shared/types";

interface Params {
  localStep: LocalStep;

  overlay: "NONE" | "VIEW_TABLE";
  openTableView: () => void;
  closeTableView: () => void;

  setLocalStep: (step: LocalStep) => void;

  selectedTargetId: string | null;
  setSelectedTargetId: (id: string | null) => void;

  selectedCardIds: string[];
  setSelectedCardIds: (ids: string[]) => void;

  // 🔑 Added for Next Round handling
  gameOver: any;
  setPhase: (phase: GamePhase) => void;
}

export const useGameActions = ({
  localStep,
  overlay,
  openTableView,
  closeTableView,
  setLocalStep,
  selectedTargetId,
  setSelectedTargetId,
  selectedCardIds,
  setSelectedCardIds,
  gameOver,
  setPhase
}: Params) => {
  /* -------------------------------------------------- */
  /* ---------------- ROOM ACTIONS -------------------- */
  /* -------------------------------------------------- */

  const createRoom = () => {
    socket.connect();
    socket.emit("create_room");
  };

  const joinRoom = (roomId: string) => {
    socket.connect();
    socket.emit("join_room", { roomId });
  };

  /* -------------------------------------------------- */
  /* ---------------- TARGET SELECTION ---------------- */
  /* -------------------------------------------------- */

  const selectTarget = (targetId: string) => {
    if (localStep !== LocalStep.PICK_TARGET) return;
    setSelectedTargetId(targetId);
  };

  const confirmTarget = () => {
    if (!canTransition(localStep, LocalStep.BETTING)) return;
    if (!selectedTargetId) return;

    socket.emit("action_target", { targetId: selectedTargetId });
  };

  /* -------------------------------------------------- */
  /* ---------------- GAME FLOW ----------------------- */
  /* -------------------------------------------------- */

  const placeBet = (amount: number) => {
    if (!canTransition(localStep, LocalStep.PICK_HAND)) return;

    setLocalStep(LocalStep.PICK_HAND);
    socket.emit("action_bet", { amount });
  };

  const toggleCard = (cardId: string) => {
    if (localStep !== LocalStep.PICK_HAND) return;

    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else if (selectedCardIds.length < 5) {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const submitHand = () => {
    if (localStep !== LocalStep.PICK_HAND) return;
    if (!selectedTargetId) return;
    if (selectedCardIds.length !== 5) return;

    setLocalStep(LocalStep.WAITING);
    socket.emit("action_submit", { cardIds: selectedCardIds });
  };

  // 🔑 Next Round handler respecting gameOver
  const nextRound = () => {
    if (gameOver) {
      console.log("[CLIENT] Match ended. Switching to Game Over screen.");
      setPhase("GAME_OVER");
      return;
    }

    console.log("[CLIENT] Requesting next round");
    socket.emit("next_round_request");
  };

  /* -------------------------------------------------- */
  /* ---------------- VIEW CONTROL -------------------- */
  /* -------------------------------------------------- */

  const toggleViewTable = () => {
    if (overlay === "VIEW_TABLE") {
      closeTableView();
    } else {
      openTableView();
    }
  };

  return {
    createRoom,
    joinRoom,

    selectTarget,
    confirmTarget,

    placeBet,
    toggleCard,
    submitHand,
    nextRound,        // 🔑 Added here
    toggleViewTable
  };
};
