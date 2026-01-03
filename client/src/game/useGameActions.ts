// client/src/game/useGameActions.ts
import { socket } from "../network/socketBridge";
import { LocalStep, canTransition } from "./localSteps";

interface Params {
  localStep: LocalStep;
  setLocalStep: (step: LocalStep) => void;

  selectedTargetId: string | null;
  setSelectedTargetId: (id: string | null) => void;

  selectedCardIds: string[];
  setSelectedCardIds: (ids: string[]) => void;
}

export const useGameActions = ({
  localStep,
  setLocalStep,
  selectedTargetId,
  setSelectedTargetId,
  selectedCardIds,
  setSelectedCardIds
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
  /* ---------------- GAME FLOW ----------------------- */
  /* -------------------------------------------------- */

  const lockTarget = (targetId: string) => {
    if (!canTransition(localStep, LocalStep.BETTING)) return;

    setSelectedTargetId(targetId);
    setLocalStep(LocalStep.BETTING);

    socket.emit("action_target", { targetId });
  };

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

  const requestNextRound = () => {
    socket.emit("next_round_request");
  };

  /* -------------------------------------------------- */
  /* ---------------- VIEW CONTROL -------------------- */
  /* -------------------------------------------------- */

  const toggleViewTable = () => {
    if (localStep === LocalStep.VIEW_TABLE) {
      setLocalStep(LocalStep.BETTING);
      return;
    }

    if (
      localStep === LocalStep.BETTING ||
      localStep === LocalStep.PICK_HAND
    ) {
      setLocalStep(LocalStep.VIEW_TABLE);
    }
  };

  return {
    createRoom,
    joinRoom,

    lockTarget,
    placeBet,
    toggleCard,
    submitHand,
    requestNextRound,

    toggleViewTable
  };
};
