// client/src/App.tsx
import React from "react";
import { useGameState } from "./game/useGameState";
import { useGameActions } from "./game/useGameActions";
import { LocalStep } from "./game/localSteps";

import { GameScene } from "./components/Scene/GameScene";
import { BettingPanel } from "./components/UI/BettingPanel";
import { SelectionGrid } from "./components/UI/SelectionGrid";
import { GameHUD } from "./components/UI/GameHUD";

export default function App() {
  const {
    state,
    setLocalStep,
    setSelectedTargetId,
    setSelectedCardIds
  } = useGameState();

  const actions = useGameActions({
    localStep: state.localStep,
    setLocalStep,
    selectedTargetId: state.selectedTargetId,
    setSelectedTargetId,
    selectedCardIds: state.selectedCardIds,
    setSelectedCardIds
  });

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      {/* 3D Scene */}
      <GameScene
        state={state}
        onTargetClick={(id) => actions.lockTarget(id)}
      />

      {/* HUD (single source of truth) */}
      <GameHUD
        roomId={state.roomId}
        timer={state.timer}
        pot={state.pot}
        bios={state.bios}
        opponentBios={state.opponentBios}
        phase={state.phase}
      />

      {/* LOBBY */}
      {state.phase === "LOBBY" && !state.roomId && (
        <div style={overlayStyle}>
          <button onClick={actions.createRoom} style={btnStyle}>
            CREATE ROOM
          </button>
          <button
            onClick={() => {
              const id = prompt("Room ID");
              if (id) actions.joinRoom(id);
            }}
            style={{ ...btnStyle, marginLeft: 20 }}
          >
            JOIN ROOM
          </button>
        </div>
      )}

      {/* BETTING */}
      {state.phase === "GAME_LOOP" &&
        state.localStep === LocalStep.BETTING && (
          <BettingPanel
            currentBios={state.bios}
            onPlaceBet={actions.placeBet}
            onToggleView={actions.toggleViewTable}
          />
        )}

      {/* CARD SELECTION */}
      {state.phase === "GAME_LOOP" &&
        state.localStep === LocalStep.PICK_HAND && (
          <SelectionGrid
            deck={state.globalDeck}
            selectedIds={state.selectedCardIds}
            onToggle={actions.toggleCard}
            onConfirm={actions.submitHand}
            onClose={actions.toggleViewTable}
            currentSum={state.currentSum}
            targetValue={state.targetValue}
          />
        )}

      {/* WAITING */}
      {state.localStep === LocalStep.WAITING && (
        <div style={overlayStyle}>
          <h2 style={{ color: "#ffd700" }}>
            Waiting for opponent...
          </h2>
        </div>
      )}

      {/* RESOLUTION */}
      {state.phase === "RESOLUTION" && (
        <div style={overlayStyle}>
          <button onClick={actions.requestNextRound} style={btnStyle}>
            NEXT ROUND
          </button>
        </div>
      )}

      {/* GAME OVER */}
      {state.phase === "GAME_OVER" && (
        <div style={overlayStyle}>
          <h1 style={{ color: "#ffd700" }}>GAME OVER</h1>
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.85)",
  zIndex: 10
};

const btnStyle: React.CSSProperties = {
  padding: "15px 30px",
  background: "#ffd700",
  border: "none",
  fontSize: "1.5rem",
  fontWeight: "bold",
  cursor: "pointer"
};
